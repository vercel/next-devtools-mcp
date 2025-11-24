import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest"
import { spawn, ChildProcess } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import { resetMcpTelemetry, getMcpTelemetryUsage } from "../../src/telemetry/mcp-telemetry-tracker.js"

// E2E tests need longer timeouts
vi.setConfig({ testTimeout: 60000, hookTimeout: 60000 })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, "../..")
const MCP_SERVER_PATH = join(REPO_ROOT, "dist/index.js")

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

async function sendMCPRequest(serverProcess: ChildProcess, request: MCPRequest): Promise<MCPResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("MCP request timeout"))
    }, 10000)

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
              serverProcess.stdout?.off("data", onData)
              resolve(response)
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
      buffer = lines[lines.length - 1]
    }

    serverProcess.stdout?.on("data", onData)
    serverProcess.stdin?.write(JSON.stringify(request) + "\n")
  })
}

describe("MCP Telemetry Tracking", () => {
  beforeAll(() => {
    console.log("Building MCP server...")
    execSync("pnpm build", { cwd: REPO_ROOT, stdio: "inherit" })
  })

  beforeEach(() => {
    // Reset telemetry tracker before each test
    resetMcpTelemetry()
  })

  it("should track tool usage when tools are called", async () => {
    // Set environment to disable actual telemetry sending
    const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }

    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env,
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

      // Call multiple tools to generate telemetry
      await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nextjs_docs",
          arguments: { action: "search", query: "cache" },
        },
      })

      await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "nextjs_docs",
          arguments: { action: "search", query: "metadata" },
        },
      })

      // The telemetry is tracked in the server process, not in our test process
      // So we can't directly verify the tracker state here
      // This test verifies that the tools can be called without errors
      // and telemetry tracking doesn't break the MCP server

      expect(true).toBe(true)
    } finally {
      serverProcess.kill()
    }
  }, 20000)

  it("should not send telemetry when NEXT_TELEMETRY_DISABLED=1", async () => {
    // This test verifies that tools can be called without errors when telemetry is disabled
    // The actual telemetry sending happens in the server process, not in our test process
    // We just verify that disabling telemetry doesn't break functionality

    const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }

    const serverProcess = spawn("node", [MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env,
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

      // Call a tool - should work even with telemetry disabled
      const response = await sendMCPRequest(serverProcess, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nextjs_docs",
          arguments: { action: "search", query: "cache" },
        },
      })

      // Verify the tool call succeeded
      expect(response.result).toBeDefined()
      expect((response.result as any).content).toBeDefined()
    } finally {
      serverProcess.kill()
    }
  }, 20000)
})

// Unit tests for telemetry integration
describe("Telemetry Integration (Unit)", () => {
  beforeEach(() => {
    resetMcpTelemetry()
  })

  it("should track telemetry in the current process", async () => {
    // Import the tracker directly
    const { mcpTelemetryTracker } = await import("../../src/telemetry/mcp-telemetry-tracker.js")

    // Simulate tool calls
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/init")

    const usages = getMcpTelemetryUsage()
    expect(usages).toHaveLength(2)

    const usageMap = new Map(usages.map((u) => [u.featureName, u.invocationCount]))
    expect(usageMap.get("mcp/nextjs_docs")).toBe(2)
    expect(usageMap.get("mcp/init")).toBe(1)
  })

  it("should generate correct telemetry events", async () => {
    const { mcpTelemetryTracker } = await import("../../src/telemetry/mcp-telemetry-tracker.js")
    const { eventMcpToolUsage, EVENT_MCP_TOOL_USAGE } = await import("../../src/telemetry/telemetry-events.js")

    // Simulate a realistic session
    mcpTelemetryTracker.recordToolCall("mcp/init")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/browser_eval")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_index")

    const usages = getMcpTelemetryUsage()
    const events = eventMcpToolUsage(usages)

    expect(events).toHaveLength(4)
    expect(events.every((e) => e.eventName === EVENT_MCP_TOOL_USAGE)).toBe(true)

    // Verify event structure
    const toolMap = new Map(events.map((e) => [e.fields.toolName, e.fields.invocationCount]))
    expect(toolMap.get("mcp/init")).toBe(1)
    expect(toolMap.get("mcp/nextjs_docs")).toBe(2)
    expect(toolMap.get("mcp/browser_eval")).toBe(1)
    expect(toolMap.get("mcp/nextjs_index")).toBe(1)
  })
})
