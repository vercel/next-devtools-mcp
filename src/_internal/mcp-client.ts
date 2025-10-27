import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

export interface MCPConnection {
  client: Client
  transport: StdioClientTransport
}

/**
 * Connect to an external MCP server via stdio
 */
export async function connectToMCPServer(
  command: string,
  args: string[] = [],
  options?: {
    cwd?: string
    env?: Record<string, string>
  }
): Promise<MCPConnection> {
  // Create the client
  const client = new Client(
    {
      name: "next-devtools-mcp-client",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  )

  // Create stdio transport with server parameters
  const transport = new StdioClientTransport({
    command,
    args,
    cwd: options?.cwd,
    env: options?.env,
    stderr: "pipe", // Pipe stderr so we can listen to it
  })

  // Listen to stderr for debugging
  const stderrStream = transport.stderr
  if (stderrStream) {
    stderrStream.on("data", (data) => {
      console.error(`[MCP Server stderr]: ${data}`)
    })
  }

  // Connect client to transport (this also starts the server process)
  await client.connect(transport)

  return {
    client,
    transport,
  }
}

/**
 * Check if a tool is available on the connected MCP server
 */
export async function listServerTools(connection: MCPConnection): Promise<string[]> {
  try {
    const result = await connection.client.listTools()
    return result.tools.map((tool) => tool.name)
  } catch (error) {
    console.error("Failed to list tools:", error)
    return []
  }
}

/**
 * Call a tool on the connected MCP server
 */
export async function callServerTool(
  connection: MCPConnection,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    const result = await connection.client.callTool({
      name: toolName,
      arguments: args,
    })
    return result
  } catch (error) {
    console.error(`Failed to call tool ${toolName}:`, error)
    throw error
  }
}

/**
 * Disconnect from MCP server and cleanup
 */
export async function disconnectFromMCPServer(connection: MCPConnection): Promise<void> {
  try {
    await connection.transport.close()
    await connection.client.close()
  } catch (error) {
    console.error("Error disconnecting from MCP server:", error)
    throw error
  }
}
