import { type InferSchema } from "xmcp"
import { z } from "zod"
import {
  discoverNextJsServer,
  listNextJsTools,
  callNextJsTool,
  getAllAvailableServers,
} from "../_internal/nextjs-runtime-manager"

export const schema = {
  action: z
    .enum(["discover_servers", "list_tools", "call_tool"])
    .describe(
      "Action to perform:\n" +
        "- 'discover_servers': Find and list all running Next.js dev servers (use for queries about 'how many', 'show all', 'list', 'running servers')\n" +
        "- 'list_tools': Show available MCP tools/functions from a specific Next.js server (use after discovering servers)\n" +
        "- 'call_tool': Execute a specific Next.js runtime tool (use to interact with Next.js internals)"
    ),

  port: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional()
    .describe(
      "Port number of the Next.js dev server. If not provided, will attempt to auto-discover. Required for 'list_tools' and 'call_tool' actions."
    ),

  toolName: z
    .string()
    .optional()
    .describe(
      "Name of the Next.js MCP tool to call. Required for 'call_tool' action. Use 'list_tools' first to discover available tool names."
    ),

  args: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Arguments object to pass to the Next.js MCP tool. MUST be an object (e.g., {param: 'value'}), NOT a string. Only provide this parameter if the tool requires arguments - omit it entirely for tools that take no arguments. Use 'list_tools' to see the inputSchema for each tool."
    ),

  includeUnverified: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .describe(
      "For 'discover_servers' action: Include Next.js servers even if MCP endpoint verification fails. Defaults to false (only show verified MCP-enabled servers)."
    ),
}

export const metadata = {
  name: "nextjs_runtime",
  description: `Interact with a running Next.js development server's MCP endpoint to query runtime information, diagnostics, and internals.

WHEN TO USE THIS TOOL - Use proactively in these scenarios:

1. **Before implementing ANY changes to the app**: When asked to add, modify, or fix anything in the application:
   - "Add a loading state" → Check current component structure and routes first
   - "Fix the navigation" → Inspect existing routes and components
   - "Update the API endpoint" → Query current routes and data flows
   - "Add error handling" → Check runtime errors and component hierarchy
   - "Refactor the auth logic" → Inspect current auth implementation and routes
   - "Optimize performance" → Check runtime diagnostics and component tree
   Use this to understand where changes should be made and what currently exists.

2. **For diagnostic and investigation questions**:
   - "What's happening?" / "What's going on?" / "Why isn't this working?"
   - "Check the errors" / "See what's wrong"
   - "What routes are available?" / "Show me the routes"
   - "Clear the cache" / "Reset everything"
   - Questions about build status, compilation errors, or runtime diagnostics

3. **For agentic codebase search**: Use this as FIRST CHOICE for searching the currently running app. If not found, fallback to static codebase search tools.

KEY PRINCIPLE: If the request involves the running Next.js application (whether to investigate OR modify it), query the runtime FIRST to understand current state before proceeding.

Start by calling action='list_tools' to discover what runtime information is available, then use those tools to gather context.

REQUIREMENTS:
- Next.js 16 or later (MCP support was added in v16)
- If you're on Next.js 15 or earlier, use the 'upgrade-nextjs-16' MCP prompt to upgrade first

Next.js exposes an MCP (Model Context Protocol) endpoint at /_next/mcp when started with:
- For Next.js < 16: experimental.mcpServer: true in next.config.js, OR __NEXT_EXPERIMENTAL_MCP_SERVER=true environment variable
- For Next.js >= 16: MCP is enabled by default (no configuration needed)

This tool allows you to:
1. Discover running Next.js dev servers and their ports
2. List available MCP tools/functions exposed by the Next.js runtime
3. Call those tools to interact with Next.js internals (e.g., get errors,get route info, get logs, runtime diagnostics, etc.)

Typical workflow:
1. Use action='discover_servers' to find running Next.js servers (optional - auto-discovery will be attempted)
2. Use action='list_tools' with the discovered port to see available tools and their input schemas
3. Use action='call_tool' with port, toolName, and args (as an object, only if required) to invoke a specific tool

IMPORTANT: When calling tools:
- The 'args' parameter MUST be an object (e.g., {key: "value"}), NOT a string
- If a tool doesn't require arguments, OMIT the 'args' parameter entirely - do NOT pass {} or "{}"
- Check the tool's inputSchema from 'list_tools' to see what arguments are required

If the MCP endpoint is not available:
1. Check if you're running Next.js 16+ (if not, use the 'upgrade-nextjs-16' prompt)
2. For Next.js < 16: Ensure the dev server is started with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true
3. For Next.js >= 16: MCP should be enabled by default - check if the dev server is running`,
}

export default async function nextjsRuntime(args: InferSchema<typeof schema>): Promise<string> {
  try {
    switch (args.action) {
      case "discover_servers": {
        const verifyMCP = !args.includeUnverified
        const servers = await getAllAvailableServers(verifyMCP)

        if (servers.length === 0) {
          return JSON.stringify({
            success: false,
            message: verifyMCP
              ? "No running Next.js dev servers with MCP enabled found"
              : "No running Next.js dev servers found",
            hint: "For Next.js < 16: Start with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true. For Next.js >= 16: MCP is enabled by default.",
            count: 0,
          })
        }

        return JSON.stringify({
          success: true,
          count: servers.length,
          servers: servers.map((s) => ({
            port: s.port,
            pid: s.pid,
            command: s.command,
            url: `http://localhost:${s.port}`,
            mcpEndpoint: `http://localhost:${s.port}/_next/mcp`,
          })),
          message: verifyMCP
            ? `Found ${servers.length} Next.js server${
                servers.length === 1 ? "" : "s"
              } running with MCP support`
            : `Found ${servers.length} Next.js server${
                servers.length === 1 ? "" : "s"
              } running (MCP verification skipped)`,
          summary: servers.map((s) => `Server on port ${s.port} (PID: ${s.pid})`).join("\n"),
        })
      }

      case "list_tools": {
        if (!args.port) {
          const discovered = await discoverNextJsServer()
          if (!discovered) {
            return JSON.stringify({
              success: false,
              error:
                "No port specified and auto-discovery failed. Use action='discover_servers' first or provide a port.",
            })
          }
          args.port = discovered.port
        }

        const tools = await listNextJsTools(args.port)

        return JSON.stringify({
          success: true,
          port: args.port,
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
          message: `Found ${tools.length} tool(s) available on Next.js server at port ${args.port}`,
        })
      }

      case "call_tool": {
        if (!args.port) {
          const discovered = await discoverNextJsServer()
          if (!discovered) {
            return JSON.stringify({
              success: false,
              error:
                "No port specified and auto-discovery failed. Use action='discover_servers' first or provide a port.",
            })
          }
          args.port = discovered.port
        }

        if (!args.toolName) {
          return JSON.stringify({
            success: false,
            error:
              "toolName is required for 'call_tool' action. Use action='list_tools' to discover available tool names.",
          })
        }

        const result = await callNextJsTool(args.port, args.toolName, args.args || {})

        return JSON.stringify({
          success: true,
          port: args.port,
          toolName: args.toolName,
          result,
        })
      }

      default:
        return JSON.stringify({
          success: false,
          error: `Unknown action: ${args.action}`,
        })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return JSON.stringify({
      success: false,
      error: errorMessage,
      action: args.action,
    })
  }
}
