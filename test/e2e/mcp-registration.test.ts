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

describe("MCP Server Registration", () => {
  beforeAll(() => {
    console.log("Building MCP server...")
    execSync("pnpm build", { cwd: REPO_ROOT, stdio: "inherit" })
  })

  it("should register all tools correctly", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // List tools
      const toolsResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      })

      expect(toolsResponse.result).toBeDefined()
      const tools = (toolsResponse.result as any).tools

      // Verify all expected tools are present
      const expectedTools = [
        "init",
        "browser_eval",
        "nextjs_docs",
        "nextjs_index",
        "nextjs_call",
        "upgrade_nextjs_16",
        "enable_cache_components",
      ]

      const toolNames = tools.map((t: any) => t.name)
      console.log("Registered tools:", toolNames)

      for (const expectedTool of expectedTools) {
        expect(toolNames).toContain(expectedTool)
      }

      expect(tools.length).toBe(expectedTools.length)
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should register all prompts correctly", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // List prompts
      const promptsResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "prompts/list",
      })

      expect(promptsResponse.result).toBeDefined()
      const prompts = (promptsResponse.result as any).prompts

      // Verify all expected prompts are present
      const expectedPrompts = ["upgrade-nextjs-16", "enable-cache-components"]

      const promptNames = prompts.map((p: any) => p.name)
      console.log("Registered prompts:", promptNames)

      for (const expectedPrompt of expectedPrompts) {
        expect(promptNames).toContain(expectedPrompt)
      }

      expect(prompts.length).toBe(expectedPrompts.length)
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should register all resources correctly", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // List resources
      const resourcesResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "resources/list",
      })

      expect(resourcesResponse.result).toBeDefined()
      const resources = (resourcesResponse.result as any).resources

      console.log(
        "Registered resources:",
        resources.map((r: any) => r.uri || r.name)
      )

      // Verify we have resources registered
      expect(resources.length).toBeGreaterThan(0)

      // Check for expected resource patterns
      const resourceURIs = resources.map((r: any) => r.uri || r.name)

      // Should have Next.js 16 knowledge resources
      const hasKnowledgeResources = resourceURIs.some(
        (uri: string) => uri.includes("nextjs16") || uri.includes("knowledge")
      )
      expect(hasKnowledgeResources).toBe(true)

      console.log(`Total resources registered: ${resources.length}`)
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should successfully read a resource", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // List resources to get available URIs
      const resourcesResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "resources/list",
      })

      const resources = (resourcesResponse.result as any).resources
      expect(resources.length).toBeGreaterThan(0)

      // Try to read the first resource
      const firstResource = resources[0]
      const resourceURI = firstResource.uri || firstResource.name

      console.log(`Attempting to read resource: ${resourceURI}`)

      const readResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 3,
        method: "resources/read",
        params: { uri: resourceURI },
      })

      if (readResponse.error) {
        console.error("Resource read error:", JSON.stringify(readResponse.error, null, 2))
      }
      if (!readResponse.result) {
        console.error("Full response:", JSON.stringify(readResponse, null, 2))
      }

      expect(readResponse.result).toBeDefined()
      const contents = (readResponse.result as any).contents
      expect(contents).toBeDefined()
      expect(contents.length).toBeGreaterThan(0)

      console.log(`Successfully read resource, content length: ${contents[0]?.text?.length || 0}`)
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should successfully call a tool", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // Call nextjs_docs tool with a simple query
      const toolResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: 'nextjs_docs',
          arguments: { action: 'search', query: 'cache' },
        },
      })

      expect(toolResponse.result).toBeDefined()
      const content = (toolResponse.result as any).content
      expect(content).toBeDefined()
      expect(content.length).toBeGreaterThan(0)
      expect(content[0].text).toContain("Next.js")

      console.log("Tool call successful!")
    } finally {
      serverProcess.kill()
    }
  }, 10000)

  it("should successfully get a prompt", async () => {
    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "inherit"],
    })

    try {
      // Initialize connection
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

      // Get upgrade-nextjs-16 prompt
      const promptResponse = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "prompts/get",
        params: {
          name: "upgrade-nextjs-16",
          arguments: {},
        },
      })

      if (promptResponse.error) {
        console.error("Prompt get error:", JSON.stringify(promptResponse.error, null, 2))
      }
      if (!promptResponse.result) {
        console.error("Full response:", JSON.stringify(promptResponse, null, 2))
      }

      expect(promptResponse.result).toBeDefined()
      const messages = (promptResponse.result as any).messages
      expect(messages).toBeDefined()
      expect(messages.length).toBeGreaterThan(0)
      expect(messages[0].content.text).toContain("Next.js")

      console.log("Prompt retrieval successful!")
    } finally {
      serverProcess.kill()
    }
  }, 10000)
})
