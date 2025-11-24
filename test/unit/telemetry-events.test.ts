import { describe, it, expect } from "vitest"
import { eventMcpToolUsage, EVENT_MCP_TOOL_USAGE } from "../../src/telemetry/telemetry-events.js"

describe("Telemetry Events", () => {
  it("should generate event for single tool usage", () => {
    const events = eventMcpToolUsage([
      {
        featureName: "mcp/init",
        invocationCount: 1,
      },
    ])

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({
      eventName: EVENT_MCP_TOOL_USAGE,
      fields: {
        toolName: "mcp/init",
        invocationCount: 1,
      },
    })
  })

  it("should generate events for multiple tool usages", () => {
    const events = eventMcpToolUsage([
      {
        featureName: "mcp/nextjs_docs",
        invocationCount: 3,
      },
      {
        featureName: "mcp/browser_eval",
        invocationCount: 2,
      },
    ])

    expect(events).toHaveLength(2)
    expect(events[0]).toEqual({
      eventName: EVENT_MCP_TOOL_USAGE,
      fields: {
        toolName: "mcp/nextjs_docs",
        invocationCount: 3,
      },
    })
    expect(events[1]).toEqual({
      eventName: EVENT_MCP_TOOL_USAGE,
      fields: {
        toolName: "mcp/browser_eval",
        invocationCount: 2,
      },
    })
  })

  it("should handle all 7 MCP tool types", () => {
    const events = eventMcpToolUsage([
      { featureName: "mcp/browser_eval", invocationCount: 1 },
      { featureName: "mcp/enable_cache_components", invocationCount: 1 },
      { featureName: "mcp/init", invocationCount: 1 },
      { featureName: "mcp/nextjs_docs", invocationCount: 1 },
      { featureName: "mcp/nextjs_index", invocationCount: 1 },
      { featureName: "mcp/nextjs_call", invocationCount: 1 },
      { featureName: "mcp/upgrade_nextjs_16", invocationCount: 1 },
    ])

    expect(events).toHaveLength(7)
    expect(events.every((e) => e.eventName === EVENT_MCP_TOOL_USAGE)).toBe(true)
  })

  it("should handle empty usage array", () => {
    const events = eventMcpToolUsage([])
    expect(events).toEqual([])
  })

  it("should transform featureName to toolName", () => {
    const events = eventMcpToolUsage([
      {
        featureName: "mcp/nextjs_docs",
        invocationCount: 5,
      },
    ])

    // The event should have 'toolName' in fields, not 'featureName'
    expect(events[0].fields).toHaveProperty("toolName")
    expect(events[0].fields).not.toHaveProperty("featureName")
    expect(events[0].fields.toolName).toBe("mcp/nextjs_docs")
  })

  it("should use correct event name constant", () => {
    const events = eventMcpToolUsage([
      { featureName: "mcp/init", invocationCount: 1 },
    ])

    expect(events[0].eventName).toBe("NEXT_MCP_TOOL_USAGE")
    expect(events[0].eventName).toBe(EVENT_MCP_TOOL_USAGE)
  })
})
