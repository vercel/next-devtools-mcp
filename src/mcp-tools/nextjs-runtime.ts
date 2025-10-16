import { tool } from "ai"
import { z } from "zod"
import {
  discoverNextJsServer,
  listNextJsTools,
  callNextJsTool,
  getAllAvailableServers,
} from "../lib/nextjs-runtime-manager.js"

const nextjsRuntimeInputSchema = z.object({
  action: z
    .enum(["discover_servers", "list_tools", "call_tool"])
    .describe(
      "Action to perform:\n" +
      "- 'discover_servers': Find and list all running Next.js dev servers (use for queries about 'how many', 'show all', 'list', 'running servers')\n" +
      "- 'list_tools': Show available MCP tools/functions from a specific Next.js server (use after discovering servers)\n" +
      "- 'call_tool': Execute a specific Next.js runtime tool (use to interact with Next.js internals)"
    ),

  port: z
    .number()
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
    .boolean()
    .optional()
    .describe(
      "For 'discover_servers' action: Include Next.js servers even if MCP endpoint verification fails. Defaults to false (only show verified MCP-enabled servers)."
    ),
})

export const nextjsRuntimeTool = tool({
  description: `Discover, inspect, and interact with running Next.js development servers and their MCP endpoints.

USE THIS TOOL WHEN:
- User asks about running Next.js servers (e.g., "how many Next.js apps are running?", "show me running servers", "list Next.js apps")
- User wants to see what servers/apps are active
- User wants to interact with Next.js runtime capabilities
- User needs to call Next.js internal tools or APIs
- User asks about server ports, PIDs, or processes

COMMON QUERY EXAMPLES:
✓ "How many Next.js apps with MCP are running?"
✓ "Show me all running Next.js servers"
✓ "List running Next.js development servers"
✓ "What Next.js apps are currently active?"
✓ "Are there any Next.js servers running?"
✓ "What tools are available in the Next.js runtime?"
✓ "Clear the Next.js cache"

REQUIREMENTS:
- Next.js 16 or later (MCP support was added in v16)
- If you're on Next.js 15 or earlier, use the 'upgrade-nextjs-16' MCP prompt to upgrade first

Next.js exposes an MCP (Model Context Protocol) endpoint at /_next/mcp when started with:
- experimental.mcpServer: true in next.config.js, OR
- __NEXT_EXPERIMENTAL_MCP_SERVER=true environment variable

CAPABILITIES:
1. Discover running Next.js dev servers and their ports (action='discover_servers')
2. List available MCP tools/functions exposed by the Next.js runtime (action='list_tools')
3. Call those tools to interact with Next.js internals (action='call_tool')

TYPICAL WORKFLOW:
1. Use action='discover_servers' to find running Next.js servers
2. Use action='list_tools' with the discovered port to see available tools and their input schemas
3. Use action='call_tool' with port, toolName, and args (as an object, only if required) to invoke a specific tool

IMPORTANT: When calling tools:
- The 'args' parameter MUST be an object (e.g., {key: "value"}), NOT a string
- If a tool doesn't require arguments, OMIT the 'args' parameter entirely - do NOT pass {} or "{}"
- Check the tool's inputSchema from 'list_tools' to see what arguments are required

If the MCP endpoint is not available:
1. Check if you're running Next.js 16+ (if not, use the 'upgrade-nextjs-16' prompt)
2. Ensure the dev server is started with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true`,
  inputSchema: nextjsRuntimeInputSchema,
  execute: async (args: z.infer<typeof nextjsRuntimeInputSchema>): Promise<string> => {
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
              hint: "Start a Next.js dev server with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true",
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
              ? `Found ${servers.length} Next.js server${servers.length === 1 ? '' : 's'} running with MCP support`
              : `Found ${servers.length} Next.js server${servers.length === 1 ? '' : 's'} running (MCP verification skipped)`,
            summary: servers.map((s) => `Server on port ${s.port} (PID: ${s.pid})`).join('\n'),
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
  },
})
