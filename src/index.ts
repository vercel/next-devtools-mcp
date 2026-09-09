#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"
import { toolInputSchema } from "./_internal/tool-input-schema.js"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import pkg from "../package.json" with { type: "json" }
import type { McpToolName } from "./telemetry/mcp-telemetry-tracker.js"
import { queueEvent, getSessionAggregationJSON } from "./telemetry/event-queue.js"
import { log } from "./telemetry/logger.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import * as browserEval from "./tools/browser-eval.js"
import * as nextjsDocs from "./tools/nextjs-docs.js"
import * as nextjsIndex from "./tools/nextjs_index.js"
import * as nextjsCall from "./tools/nextjs_call.js"

const tools = [browserEval, nextjsDocs, nextjsIndex, nextjsCall]

const toolNameToTelemetryName: Record<string, McpToolName> = {
  browser_eval: "mcp/browser_eval",
  nextjs_docs: "mcp/nextjs_docs",
  nextjs_index: "mcp/nextjs_index",
  nextjs_call: "mcp/nextjs_call",
}

// Create server
const server = new Server(
  {
    name: "next-devtools-mcp",
    version: pkg.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.metadata.name,
      description: tool.metadata.description,
      inputSchema: toolInputSchema(tool.inputSchema),
    })),
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  const tool = tools.find((t) => t.metadata.name === name)
  if (!tool) {
    throw new Error(`Tool not found: ${name}`)
  }

  // Queue telemetry event for later batch sending
  const telemetryName = toolNameToTelemetryName[name]
  if (telemetryName) {
    const event = {
      eventName: "NEXT_MCP_TOOL_USAGE",
      fields: {
        toolName: telemetryName,
        invocationCount: 1,
      },
    }
    queueEvent(event)
  }

  const parsedArgs = parseToolArgs(tool.inputSchema, args || {})

  const result = await (tool.handler as (args: Record<string, unknown>) => Promise<string>)(parsedArgs)

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  }
})

function parseToolArgs(
  schema: Record<string, z.ZodTypeAny>,
  args: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, zodSchema] of Object.entries(schema)) {
    if (args[key] !== undefined) {
      const parsed = zodSchema.safeParse(args[key])
      if (parsed.success) {
        result[key] = parsed.data
      } else {
        throw new Error(`Invalid argument '${key}': ${parsed.error.message}`)
      }
    } else if (!zodSchema.isOptional()) {
      throw new Error(`Missing required argument: ${key}`)
    }
  }

  return result
}

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  log('Server started')

  const shutdown = async () => {
    log('Server terminated')

    // Close the MCP server transport before exiting so the host (e.g. Claude
    // Code) receives a clean EOF on the stdio channel instead of an abrupt
    // disconnect.  Without this the host reports "MCP server failed" even
    // though the exit code is 0.
    try {
      await server.close()
    } catch {
      // Ignore close errors during shutdown
    }

    const aggregationJSON = getSessionAggregationJSON()

    if (aggregationJSON) {
      const flushEventsScript = join(__dirname, "telemetry", "flush-events.js")
      const child = spawn(
        process.execPath,
        [flushEventsScript, aggregationJSON],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        }
      )

      child.unref()

      log('Event flusher spawned with aggregation data')
    } else {
      log('No events to flush')
    }

    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error("Server error:", error)
  process.exit(1)
})
