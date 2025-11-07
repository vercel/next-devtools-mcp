import type { McpToolName } from "./mcp-telemetry-tracker.js"

export const EVENT_MCP_TOOL_USAGE = "NEXT_MCP_TOOL_USAGE"

export type EventMcpToolUsage = {
  toolName: McpToolName
  invocationCount: number
}

export type TelemetryEvent = {
  eventName: string
  fields: EventMcpToolUsage
}

export function eventMcpToolUsage(
  usages: Array<{ featureName: McpToolName; invocationCount: number }>
): TelemetryEvent[] {
  return usages.map(({ featureName, invocationCount }) => ({
    eventName: EVENT_MCP_TOOL_USAGE,
    fields: {
      toolName: featureName,
      invocationCount,
    },
  }))
}
