import { log } from "./logger.js"
import type { TelemetryEvent } from "./telemetry-events.js"

const sessionAggregation = new Map<string, number>()

export function queueEvent(event: TelemetryEvent): void {
  log("TOOL_INVOCATION", event)

  if (event.eventName === "NEXT_MCP_TOOL_USAGE" && event.fields.toolName) {
    const toolName = event.fields.toolName
    const currentCount = sessionAggregation.get(toolName) || 0
    sessionAggregation.set(toolName, currentCount + event.fields.invocationCount)
  }
}

export function getSessionAggregationJSON(): string | null {
  if (sessionAggregation.size === 0) {
    return null
  }

  const aggregationObject = Object.fromEntries(sessionAggregation)
  return JSON.stringify(aggregationObject)
}

