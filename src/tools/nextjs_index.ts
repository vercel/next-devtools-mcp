import { z } from "zod"
import {
  getAllAvailableServers,
  listNextJsTools,
  detectProtocol,
  MCP_HOST,
} from "../_internal/nextjs-runtime-manager.js"

export const inputSchema = {
  port: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional()
    .describe(
      "Optional port number to probe directly. Use this when auto-discovery fails - ask the user which port their Next.js dev server is running on."
    ),
}

export const metadata = {
  name: "nextjs_index",
  description: `Discover all running Next.js development servers and list their available MCP tools.

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

REQUIREMENTS:
- Next.js 16 or later (MCP support was added in v16)
- If you're on Next.js 15 or earlier, use the 'upgrade-nextjs-16' MCP prompt to upgrade first

Next.js 16+ exposes an MCP (Model Context Protocol) endpoint at /_next/mcp automatically when the dev server starts.
No configuration needed - MCP is enabled by default in Next.js 16 and later.

This tool discovers all running Next.js servers and returns:
- Server port, PID, and URL
- Complete list of available MCP tools for each server
- Tool descriptions and input schemas

After calling this tool, use 'nextjs_call' to execute specific tools.

[IMPORTANT] If auto-discovery returns no servers:
1. Ask the user which port their Next.js dev server is running on
2. Call this tool again with the 'port' parameter set to the user-provided port

If the MCP endpoint is not available:
1. Ensure you're running Next.js 16 or later (use the 'upgrade-nextjs-16' prompt to upgrade)
2. Verify the dev server is running (npm run dev)
3. Check that the dev server started successfully without errors`,
}

type NextjsIndexArgs = {
  port?: string | number
}

async function probeAndListTools(port: number): Promise<{
  success: boolean
  server?: {
    port: number
    url: string
    toolCount: number
    tools: { name: string; description?: string; inputSchema?: Record<string, unknown> }[]
  }
  error?: string
}> {
  try {
    const protocol = await detectProtocol(port)
    const tools = await listNextJsTools(port)

    if (tools.length === 0) {
      return {
        success: false,
        error: `No MCP tools found on port ${port}. The server may not be running Next.js 16+ or MCP may not be enabled.`,
      }
    }

    return {
      success: true,
      server: {
        port,
        url: `${protocol}://${MCP_HOST}:${port}`,
        toolCount: tools.length,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to connect to port ${port}: ${errorMessage}`,
    }
  }
}

export async function handler(args: NextjsIndexArgs = {}): Promise<string> {
  try {
    // If a specific port is provided, probe it directly
    if (args.port !== undefined) {
      const portNumber = typeof args.port === "string" ? parseInt(args.port, 10) : args.port
      const result = await probeAndListTools(portNumber)

      if (result.success && result.server) {
        return JSON.stringify({
          success: true,
          count: 1,
          servers: [result.server],
          message: `Successfully connected to Next.js server on port ${portNumber}`,
        })
      } else {
        return JSON.stringify({
          success: false,
          error: result.error,
          port: portNumber,
          hint: "Make sure the Next.js dev server is running on this port and is version 16+.",
        })
      }
    }

    // Auto-discover all servers
    const servers = await getAllAvailableServers()

    if (servers.length === 0) {
      return JSON.stringify({
        success: false,
        error: "No running Next.js dev servers with MCP enabled found",
        hint: "Make sure you're running Next.js 16+ (MCP is enabled by default). Start the dev server with 'npm run dev'. If on Next.js 15 or earlier, upgrade using the 'upgrade-nextjs-16' prompt.",
        ai_instruction:
          "IMPORTANT: Server auto-discovery may not work on all operating systems or network configurations. Please ask the user: 'What port is your Next.js dev server running on?'. Once you have the port number, call this tool again with the 'port' parameter set to the user-provided port.",
        servers: [],
      })
    }

    // Get tools for each server
    const serversWithTools = await Promise.all(
      servers.map(async (s) => {
        const protocol = await detectProtocol(s.port)
        const tools = await listNextJsTools(s.port)
        return {
          port: s.port,
          pid: s.pid,
          command: s.command,
          url: `${protocol}://localhost:${s.port}`,
          toolCount: tools.length,
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        }
      })
    )

    return JSON.stringify({
      success: true,
      count: serversWithTools.length,
      servers: serversWithTools,
      message: `Found ${serversWithTools.length} Next.js server${
        serversWithTools.length === 1 ? "" : "s"
      } with MCP enabled`,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return JSON.stringify({
      success: false,
      error: errorMessage,
    })
  }
}
