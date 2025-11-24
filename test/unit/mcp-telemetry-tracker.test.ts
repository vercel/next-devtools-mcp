import { describe, it, expect, beforeEach } from "vitest"
import { mcpTelemetryTracker, resetMcpTelemetry, getMcpTelemetryUsage } from "../../src/telemetry/mcp-telemetry-tracker.js"

describe("MCP Telemetry Tracker", () => {
  beforeEach(() => {
    // Reset tracker state before each test
    resetMcpTelemetry()
  })

  it("should start with empty state", () => {
    expect(mcpTelemetryTracker.hasUsage()).toBe(false)
    expect(getMcpTelemetryUsage()).toEqual([])
  })

  it("should track a single tool invocation", () => {
    mcpTelemetryTracker.recordToolCall("mcp/init")

    expect(mcpTelemetryTracker.hasUsage()).toBe(true)
    const usages = getMcpTelemetryUsage()
    expect(usages).toHaveLength(1)
    expect(usages[0]).toEqual({
      featureName: "mcp/init",
      invocationCount: 1,
    })
  })

  it("should increment count on repeated calls", () => {
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")

    const usages = getMcpTelemetryUsage()
    expect(usages).toHaveLength(1)
    expect(usages[0]).toEqual({
      featureName: "mcp/nextjs_docs",
      invocationCount: 3,
    })
  })

  it("should track multiple different tools", () => {
    mcpTelemetryTracker.recordToolCall("mcp/init")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/browser_eval")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")

    const usages = getMcpTelemetryUsage()
    expect(usages).toHaveLength(3)

    // Convert to map for easier testing
    const usageMap = new Map(usages.map((u) => [u.featureName, u.invocationCount]))

    expect(usageMap.get("mcp/init")).toBe(1)
    expect(usageMap.get("mcp/nextjs_docs")).toBe(2)
    expect(usageMap.get("mcp/browser_eval")).toBe(1)
  })

  it("should track all 7 MCP tools", () => {
    mcpTelemetryTracker.recordToolCall("mcp/browser_eval")
    mcpTelemetryTracker.recordToolCall("mcp/enable_cache_components")
    mcpTelemetryTracker.recordToolCall("mcp/init")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_index")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_call")
    mcpTelemetryTracker.recordToolCall("mcp/upgrade_nextjs_16")

    const usages = getMcpTelemetryUsage()
    expect(usages).toHaveLength(7)

    const toolNames = usages.map((u) => u.featureName)
    expect(toolNames).toContain("mcp/browser_eval")
    expect(toolNames).toContain("mcp/enable_cache_components")
    expect(toolNames).toContain("mcp/init")
    expect(toolNames).toContain("mcp/nextjs_docs")
    expect(toolNames).toContain("mcp/nextjs_index")
    expect(toolNames).toContain("mcp/nextjs_call")
    expect(toolNames).toContain("mcp/upgrade_nextjs_16")
  })

  it("should reset tracking state", () => {
    mcpTelemetryTracker.recordToolCall("mcp/init")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")

    expect(mcpTelemetryTracker.hasUsage()).toBe(true)

    resetMcpTelemetry()

    expect(mcpTelemetryTracker.hasUsage()).toBe(false)
    expect(getMcpTelemetryUsage()).toEqual([])
  })

  it("should handle realistic usage patterns", () => {
    // Simulate a typical session
    mcpTelemetryTracker.recordToolCall("mcp/init") // Called once at start
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs") // Query docs multiple times
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_docs")
    mcpTelemetryTracker.recordToolCall("mcp/browser_eval") // Browser testing
    mcpTelemetryTracker.recordToolCall("mcp/browser_eval")
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_index") // Discover servers
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_call") // Call runtime tool
    mcpTelemetryTracker.recordToolCall("mcp/nextjs_call") // Call another tool
    mcpTelemetryTracker.recordToolCall("mcp/upgrade_nextjs_16") // Run upgrade

    const usages = getMcpTelemetryUsage()
    const usageMap = new Map(usages.map((u) => [u.featureName, u.invocationCount]))

    expect(usageMap.get("mcp/init")).toBe(1)
    expect(usageMap.get("mcp/nextjs_docs")).toBe(3)
    expect(usageMap.get("mcp/browser_eval")).toBe(2)
    expect(usageMap.get("mcp/nextjs_index")).toBe(1)
    expect(usageMap.get("mcp/nextjs_call")).toBe(2)
    expect(usageMap.get("mcp/upgrade_nextjs_16")).toBe(1)
  })
})
