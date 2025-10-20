import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface NextJsServerInfo {
  port: number
  pid: number
  command: string
}

interface NextJsMCPTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

interface NextJsMCPResponse {
  jsonrpc: string
  result?: {
    tools?: NextJsMCPTool[]
    [key: string]: unknown
  }
  error?: {
    code: number
    message: string
  }
  id: number | string
}

async function findNextJsServers(): Promise<NextJsServerInfo[]> {
  try {
    const { stdout } = await execAsync("ps aux")
    const lines = stdout.split("\n")
    const servers: NextJsServerInfo[] = []
    const seenPorts = new Set<number>()

    for (const line of lines) {
      // Enhanced detection patterns for Next.js servers
      const isNextJsProcess = 
        line.includes("next dev") || 
        line.includes("next-server") ||
        line.includes("next/dist/bin/next") ||
        (line.includes("node") && line.includes("next") && line.includes("dev"))

      if (isNextJsProcess) {
        const parts = line.trim().split(/\s+/)
        const pid = parseInt(parts[1], 10)
        const command = parts.slice(10).join(" ")

        // Try multiple methods to detect port
        const portMatch = 
          command.match(/--port[=\s]+(\d+)/) || 
          command.match(/-p[=\s]+(\d+)/) ||
          command.match(/:(\d+)/)
        
        let port = 3000 // Default Next.js port

        if (portMatch) {
          port = parseInt(portMatch[1], 10)
        } else {
          // Fallback: use lsof to find the listening port
          try {
            const processInfo = await execAsync(`lsof -Pan -p ${pid} -i 2>/dev/null || true`)
            const portFromLsof = processInfo.stdout.match(/:(\d+).*LISTEN/)
            if (portFromLsof) {
              port = parseInt(portFromLsof[1], 10)
            }
          } catch {
            // If lsof fails, continue with default port
          }
        }

        // Avoid duplicate ports (in case multiple processes are detected)
        if (!seenPorts.has(port)) {
          seenPorts.add(port)
          servers.push({ port, pid, command })
        }
      }
    }

    return servers
  } catch (error) {
    console.error("[Next.js Runtime Manager] Error finding Next.js servers:", error)
    return []
  }
}

async function makeNextJsMCPRequest(
  port: number,
  method: string,
  params: Record<string, unknown> = {}
): Promise<NextJsMCPResponse> {
  const url = `http://localhost:${port}/_next/mcp`

  const jsonRpcRequest = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify(jsonRpcRequest),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `MCP endpoint not found. Next.js MCP support requires Next.js 16+. ` +
          `If you're on an older version, upgrade using the 'upgrade-nextjs-16' MCP prompt. ` +
          `If you're already on Next.js 16+: MCP is enabled by default - make sure the dev server is running. ` +
          `For Next.js < 16: enable MCP with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true in next.config.js`
        )
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const text = await response.text()
    const dataLine = text.split("\n").find((line) => line.startsWith("data: "))

    if (!dataLine) {
      throw new Error("Invalid SSE response: no data line found")
    }

    const jsonData = dataLine.substring(6)
    const mcpResponse: NextJsMCPResponse = JSON.parse(jsonData)

    if (mcpResponse.error) {
      throw new Error(`MCP Error: ${mcpResponse.error.message}`)
    }

    return mcpResponse
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(
        `Cannot connect to Next.js dev server on port ${port}. ` +
        `Make sure the dev server is running. For Next.js < 16: ` +
        `enable MCP with __NEXT_EXPERIMENTAL_MCP_SERVER=true or experimental.mcpServer: true. ` +
        `For Next.js >= 16: MCP is enabled by default. If you're on Next.js 15 or earlier, upgrade using the 'upgrade-nextjs-16' MCP prompt.`
      )
    }

    if (
      error instanceof Error &&
      (error.message.includes("MCP endpoint not found") || error.message.includes("MCP Error"))
    ) {
      throw error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to call Next.js MCP endpoint: ${errorMessage}`)
  }
}

export async function discoverNextJsServer(
  preferredPort?: number
): Promise<NextJsServerInfo | null> {
  const servers = await findNextJsServers()

  if (servers.length === 0) {
    return null
  }

  if (preferredPort) {
    const server = servers.find((s) => s.port === preferredPort)
    if (server) {
      return server
    }
  }

  if (servers.length === 1) {
    return servers[0]
  }

  return null
}

export async function listNextJsTools(port: number): Promise<NextJsMCPTool[]> {
  try {
    const response = await makeNextJsMCPRequest(port, "tools/list", {})
    return response.result?.tools || []
  } catch (error) {
    console.error("[Next.js Runtime Manager] Error listing tools:", error)
    return []
  }
}

export async function callNextJsTool(
  port: number,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  try {
    const response = await makeNextJsMCPRequest(port, "tools/call", {
      name: toolName,
      arguments: args,
    })

    return response.result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to call tool '${toolName}': ${errorMessage}`)
  }
}

/**
 * Verify if a server has MCP endpoint available
 */
async function verifyMCPEndpoint(port: number): Promise<boolean> {
  try {
    const url = `http://localhost:${port}/_next/mcp`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: 1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok || response.status === 200
  } catch {
    return false
  }
}

export async function getAllAvailableServers(verifyMCP: boolean = true): Promise<NextJsServerInfo[]> {
  const servers = await findNextJsServers()
  
  if (!verifyMCP) {
    return servers
  }

  // Filter servers that actually have MCP enabled
  const verifiedServers: NextJsServerInfo[] = []
  
  await Promise.all(
    servers.map(async (server) => {
      const hasMCP = await verifyMCPEndpoint(server.port)
      if (hasMCP) {
        verifiedServers.push(server)
      }
    })
  )

  return verifiedServers
}
