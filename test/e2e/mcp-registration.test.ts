import { describe, it, expect, beforeAll, vi } from "vitest"
import { spawn } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

// E2E tests need longer timeouts
vi.setConfig({ testTimeout: 600000, hookTimeout: 60000 })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '../..')
const MCP_SERVER_PATH = join(REPO_ROOT, 'dist/index.js')

interface MCPRequest {
  jsonrpc: "2.0"
  id: number
  method: string
  params?: unknown
}

interface MCPResponse {
  jsonrpc: "2.0"
  id: number
  result?: unknown
  error?: { code: number; message: string }
}

async function sendMCPRequest(serverProcess: any, request: MCPRequest): Promise<MCPResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("MCP request timeout"))
    }, 5000)

    let buffer = ""
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString()
      const lines = buffer.split("\n")

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim()
        if (line) {
          try {
            const response = JSON.parse(line)
            if (response.id === request.id) {
              clearTimeout(timeout)
              serverProcess.stdout.off("data", onData)
              resolve(response)
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
      buffer = lines[lines.length - 1]
    }

    serverProcess.stdout.on("data", onData)
    serverProcess.stdin.write(JSON.stringify(request) + "\n")
  })
}

async function initialize(serverProcess: any): Promise<void> {
  await sendMCPRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  })
}

describe("MCP Server Registration", () => {
  beforeAll(() => {
    console.log("Building MCP server...")
    execSync("pnpm build", { cwd: REPO_ROOT, stdio: "inherit" })
  })

  it("should register exactly the thin-wrapper tools", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      await initialize(serverProcess)

      const toolsResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      })

      expect(toolsResponse.result).toBeDefined()
      const tools = (toolsResponse.result as any).tools
      const toolNames = tools.map((t: any) => t.name).sort()

      // Thin wrapper: server discovery/proxy, browser automation, and a
      // version-aware docs gateway. The upgrade/cache-components knowledge tools,
      // prompts, and resources were removed (workflows are skills); nextjs_docs
      // no longer fetches — it points at the bundled docs in node_modules.
      expect(toolNames).toEqual([
        "browser_eval",
        "nextjs_call",
        "nextjs_docs",
        "nextjs_index",
      ])
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should not advertise any prompts", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      await initialize(serverProcess)

      const promptsResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "prompts/list",
      })

      // The server no longer declares the prompts capability, so this is an error.
      expect(promptsResponse.error).toBeDefined()
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should not advertise any resources", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      await initialize(serverProcess)

      const resourcesResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "resources/list",
      })

      // The server no longer declares the resources capability, so this is an error.
      expect(resourcesResponse.error).toBeDefined()
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should successfully call a tool", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      await initialize(serverProcess)

      // nextjs_index discovers running dev servers; it succeeds even when none
      // are running (returning a "no servers found" message), so it is safe to
      // call without test infrastructure.
      const toolResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nextjs_index",
          arguments: {},
        },
      })

      expect(toolResponse.result).toBeDefined()
      const content = (toolResponse.result as any).content
      expect(content).toBeDefined()
      expect(content.length).toBeGreaterThan(0)
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should treat null for nextjs_call args as omitted", async () => {
    // Fake /_next/mcp endpoint on loopback; NEXT_DEVTOOLS_HOST points the server at it (src/_internal/nextjs-runtime-manager.ts:51).
    const received: unknown[] = []
    const fake = createServer(async (req, res) => {
      let body = ""
      for await (const chunk of req) body += chunk
      const request = JSON.parse(body)
      if (request.method === "tools/call") received.push(request.params.arguments)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { content: [{ type: "text", text: "fixture" }] } })}\n\n`
      )
    })
    await new Promise<void>((resolve) => fake.listen(0, "127.0.0.1", resolve))
    const port = (fake.address() as { port: number }).port

    // Isolated home: the server writes its mcp.log under the home directory via homedir() (src/telemetry/telemetry-dir.ts:9).
    const home = mkdtempSync(join(tmpdir(), "next-devtools-mcp-home-"))
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
        NEXT_DEVTOOLS_HOST: "127.0.0.1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    })
    const exited = new Promise<void>((resolve) => serverProcess.once("exit", () => resolve()))

    try {
      await initialize(serverProcess)

      // #161: null for an optional argument is treated as omitted (https://github.com/vercel/next-devtools-mcp/issues/161).
      const callWith = (id: number, extra: Record<string, unknown>) =>
        sendMCPRequest(serverProcess, {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: {
            name: "nextjs_call",
            arguments: { port, toolName: "get_errors", ...extra },
          },
        })

      const withNull = await callWith(2, { args: null })
      const omitted = await callWith(3, {})

      for (const response of [withNull, omitted]) {
        expect(response.error).toBeUndefined()
        const payload = JSON.parse((response.result as any).content[0].text)
        expect(payload.success).toBe(true)
        expect(payload.result.content[0].text).toBe("fixture")
      }
      expect(received).toEqual([{}, {}])
    } finally {
      serverProcess.kill()
      await exited
      fake.close()
      rmSync(home, { recursive: true, force: true })
    }
  }, 10000)
})
