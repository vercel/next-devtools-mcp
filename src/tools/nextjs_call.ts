import { z } from "zod"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { callNextJsTool, type RuntimeRequestOptions } from "../_internal/nextjs-runtime-manager.js"

export const inputSchema = {
  port: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .describe("Port number of the Next.js dev server (required)."),

  toolName: z
    .string()
    .describe(
      "Name of the Next.js MCP tool to call (required). Use 'nextjs_index' first to discover available tool names."
    ),

  args: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Arguments object to pass to the Next.js MCP tool. MUST be an object (e.g., {param: 'value'}), NOT a string. Only provide this parameter if the tool requires arguments - omit it entirely for tools that take no arguments. Use 'nextjs_index' to see the inputSchema for each tool."
    ),
}

export const metadata = {
  name: "nextjs_call",
  description: `Call a specific MCP tool on a running Next.js development server.

REQUIREMENTS:
- Port number of the target Next.js dev server
- Tool name to execute
- Optional arguments object (if the tool requires parameters)

Use 'nextjs_index' first to discover available servers, tools, and their input schemas.
If 'nextjs_index' auto-discovery fails, ask the user for the port and call 'nextjs_index' again with the 'port' parameter.

IMPORTANT: When calling tools:
- The 'args' parameter MUST be an object (e.g., {key: "value"}), NOT a string
- If a tool doesn't require arguments, OMIT the 'args' parameter entirely - do NOT pass {} or "{}"
- Check the tool's inputSchema from 'nextjs_index' to see what arguments are required

Common Next.js MCP tools include:
- Error diagnostics (get compilation/runtime errors)
- Route information (list all routes)
- Build status (check compilation state)
- Cache management (clear caches)
- And more (varies by Next.js version)

Example usage:
1. Call 'nextjs_index' to see servers and tools
2. Call 'nextjs_call' with port=3000, toolName="get_errors" to get errors from server on port 3000`,
}

type NextjsCallArgs = {
  port: string | number
  toolName: string
  args?: Record<string, unknown>
}

function toolResult(payload: Record<string, unknown>): CallToolResult {
  return {
    ...(payload.success === false ? { isError: true } : {}),
    content: [{ type: "text", text: JSON.stringify(payload) }],
  }
}

export async function handler(
  args: NextjsCallArgs,
  options: RuntimeRequestOptions = {}
): Promise<CallToolResult> {
  try {
    if (!args.port) {
      return toolResult({
        success: false,
        error: "Port is required.",
        hint: "Use 'nextjs_index' first to discover available servers and their ports. If auto-discovery fails, ask the user for the port and call 'nextjs_index' with the 'port' parameter.",
      })
    }

    if (!args.toolName) {
      return toolResult({
        success: false,
        error: "toolName is required.",
        hint: "Use 'nextjs_index' to discover available tool names for your server.",
      })
    }

    // Ensure port is a number
    const portNumber = typeof args.port === "string" ? parseInt(args.port, 10) : args.port

    const result = await callNextJsTool(portNumber, args.toolName, args.args || {}, options)

    return toolResult({
      success: !(
        typeof result === "object" &&
        result !== null &&
        "isError" in result &&
        result.isError === true
      ),
      port: portNumber,
      toolName: args.toolName,
      result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return toolResult({
      success: false,
      error: errorMessage,
      port: args.port,
      toolName: args.toolName,
    })
  }
}
