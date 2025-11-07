#!/usr/bin/env node
import { telemetryStorage } from "./telemetry-storage.js"
import { log } from "./logger.js"
import type { TelemetryEvent, EventMcpToolUsage } from "./telemetry-events.js"

async function flushEvents() {
  log("Event flusher started")

  const aggregationJSON = process.argv[2]

  if (!aggregationJSON) {
    log("No aggregation data provided")
    return
  }

  try {
    const aggregationObject = JSON.parse(aggregationJSON) as Record<string, number>

    if (Object.keys(aggregationObject).length === 0) {
      log("No events to flush")
      return
    }

    const events: TelemetryEvent[] = Object.entries(aggregationObject).map(
      ([toolName, invocationCount]) => ({
        eventName: "NEXT_MCP_TOOL_USAGE",
        fields: {
          toolName,
          invocationCount,
        } as EventMcpToolUsage,
      })
    )

    log(`Flushing ${events.length} aggregated events from session`, {
      breakdown: aggregationObject,
    })

    log("TELEMETRY REQUEST (from session)", {
      events,
      eventCount: events.length,
    })

    try {
      await telemetryStorage.sendEvents(events)

      log("TELEMETRY RESPONSE (from session)", {
        status: "success",
        eventCount: events.length,
      })
    } catch (error) {
      log("TELEMETRY RESPONSE (from session)", {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }

    log("Event flusher completed successfully")
  } catch (error) {
    log("Event flusher failed", { error })
  }
}

flushEvents()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    log("Event flusher error", { error })
    process.exit(1)
  })
