import { describe, it, expect, beforeAll, vi } from "vitest"
import { spawn } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

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

      // Thin wrapper: server discovery/proxy + browser automation only.
      // Docs search, prompts, and the upgrade/cache-components knowledge tools
      // were removed (docs ship in node_modules/next/dist/docs; workflows are skills).
      expect(toolNames).toEqual(["browser_eval", "nextjs_call", "nextjs_index"])
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
})
