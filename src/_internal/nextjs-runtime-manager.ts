import { findProcess } from "./find-process-import.js"
import { pidToPorts } from "pid-port"
import { exec } from "child_process"
import { promisify } from "util"
import { Agent as UndiciAgent } from "undici"

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

/**
 * Detect if we're running in WSL
 */
function isWSL(): boolean {
  return process.platform === 'linux' && (
    !!process.env.WSL_DISTRO_NAME ||
    !!process.env.WSL_INTEROP ||
    !!process.env.WSL_DISTRO
  )
}

// Cache detected protocol per port to avoid repeated detection
const protocolCache = new Map<number, "http" | "https">()

let insecureHttpsAgent: UndiciAgent | undefined

/**
 * Get fetch options for HTTPS requests
 * Automatically allows insecure TLS for HTTPS (self-signed certificates)
 * Can be disabled via NODE_TLS_REJECT_UNAUTHORIZED=0
 */
function getFetchOptions(protocol: "http" | "https") {
  // For HTTPS, automatically allow insecure TLS (for self-signed certificates)
  // Can be disabled via environment variable: NODE_TLS_REJECT_UNAUTHORIZED=0
  const allowInsecure =
    protocol === "https" && process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
    

  if (protocol !== "https" || !allowInsecure) return {}

  if (!insecureHttpsAgent) {
    insecureHttpsAgent = new UndiciAgent({ connect: { rejectUnauthorized: false } })
  }
  return { dispatcher: insecureHttpsAgent }
}

/**
 * Automatically detect protocol by trying HTTPS first, then falling back to HTTP
 * Caches the result per port to avoid repeated detection
 */
async function detectProtocol(port: number): Promise<"http" | "https"> {
  // Return cached protocol if available
  if (protocolCache.has(port)) {
    return protocolCache.get(port)!
  }

  const host = process.env.NEXT_DEVTOOLS_HOST ?? "localhost"
  
  // Try HTTPS first (with insecure TLS allowed for self-signed certificates)
  try {
    const httpsUrl = `https://${host}:${port}/_next/mcp`
    const httpsFetchOptions = getFetchOptions("https")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500) // Short timeout for quick failure

    const response = await fetch(httpsUrl, {
      ...httpsFetchOptions,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
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
    
    // If HTTPS succeeds (even if it returns an error, it means the protocol is correct)
    if (response.status !== 404) {
      protocolCache.set(port, "https")
      return "https"
    }
  } catch (error) {
    // HTTPS failed, continue to try HTTP
  }

  // HTTPS failed, fallback to HTTP
  try {
    const httpUrl = `http://${host}:${port}/_next/mcp`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 500)

    const response = await fetch(httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
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
    
    // HTTP succeeded
    if (response.status !== 404) {
      protocolCache.set(port, "http")
      return "http"
    }
  } catch (error) {
    // Both protocols failed
  }

  // Default to HTTP (backward compatibility)
  protocolCache.set(port, "http")
  return "http"
}

/**
 * Get listening ports for a process using ss command (WSL-compatible)
 * ss output format: LISTEN 0 511 *:3000 *:* users:(("next-server",pid=4660,fd=24))
 */
async function getPortsViaSs(pid: number): Promise<number[]> {
  try {
    const { stdout } = await execAsync(`ss -tlnp 2>/dev/null | grep "pid=${pid}" || true`)
    if (!stdout) return []

    const ports: number[] = []
    const lines = stdout.split('\n')

    for (const line of lines) {
      // Match port number before the "users:" part
      // Patterns like *:3000 or 127.0.0.1:3000
      const match = line.match(/[:\*](\d+)\s+[\*\d]/)
      if (match) {
        const port = parseInt(match[1], 10)
        if (!ports.includes(port)) {
          ports.push(port)
        }
      }
    }

    return ports
  } catch {
    return []
  }
}

/**
 * Get the listening port for a process by PID
 * Uses pid-port on most systems, falls back to ss command in WSL
 * @param pid - Process ID to check
 * @returns The first listening port found, or null if none
 */
async function getListeningPort(pid: number): Promise<number | null> {
  // First try the pid-port library (works on most systems)
  try {
    const ports = await pidToPorts(pid)
    if (ports.size > 0) {
      return Array.from(ports)[0]
    }
  } catch {
    // Continue to fallback methods
  }

  // If we're in WSL or on Linux where pid-port failed, try ss command
  if (isWSL() || process.platform === 'linux') {
    const ssPorts = await getPortsViaSs(pid)
    if (ssPorts.length > 0) {
      return ssPorts[0]
    }
  }

  return null
}

async function findNextJsServers(): Promise<NextJsServerInfo[]> {
  try {
    // Find next-server processes (the actual server processes)
    const nextServerProcesses = await findProcess("name", "next-server", true).catch(() => [] as Awaited<ReturnType<typeof findProcess>>)
    
    const servers: NextJsServerInfo[] = []
    const seenPorts = new Set<number>()

    for (const proc of nextServerProcesses) {
      // proc.name === "next-server" is definitive - no need to check command
      if (proc.name !== "next-server") {
        continue
      }
      
      const command = proc.cmd || ""
      
      // Always query system for listening port from the process
      const port = await getListeningPort(proc.pid)

      if (port && !seenPorts.has(port)) {
        seenPorts.add(port)
        servers.push({ port, pid: proc.pid, command })
      }
    }

    return servers
  } catch (error) {
    console.error("[next-devtools-mcp] Error finding Next.js servers:", error)
    return []
  }
}

async function makeNextJsMCPRequest(
  port: number,
  method: string,
  params: Record<string, unknown> = {}
): Promise<NextJsMCPResponse> {
  const protocol = await detectProtocol(port) // Auto-detect protocol
  const host = process.env.NEXT_DEVTOOLS_HOST ?? "localhost"
  const url = `${protocol}://${host}:${port}/_next/mcp`
  const fetchOptions = getFetchOptions(protocol)

  const jsonRpcRequest = {
    jsonrpc: "2.0",
    method,
    params,
    id: Date.now(),
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(jsonRpcRequest),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `MCP endpoint not found. Next.js MCP support requires Next.js 16+. ` +
            `If you're on an older version, upgrade using the 'upgrade-nextjs-16' MCP prompt. ` +
            `If you're already on Next.js 16+: MCP is enabled by default - make sure the dev server is running.`
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
          `Make sure the dev server is running. ` +
          `Next.js MCP support requires Next.js 16+ where MCP is enabled by default. ` +
          `If you're on Next.js 15 or earlier, upgrade using the 'upgrade-nextjs-16' MCP prompt.`
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

export async function discoverNextJsServer(): Promise<NextJsServerInfo | null> {
  const servers = await findNextJsServers()

  if (servers.length === 0) {
    return null
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
    const protocol = await detectProtocol(port) // Auto-detect protocol
    const host = process.env.NEXT_DEVTOOLS_HOST ?? "localhost"
    const url = `${protocol}://${host}:${port}/_next/mcp`
    const fetchOptions = getFetchOptions(protocol)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second timeout

    const response = await fetch(url, {
      ...fetchOptions,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
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

export async function getAllAvailableServers(
  verifyMCP: boolean = true
): Promise<NextJsServerInfo[]> {
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

// Export detectProtocol for use in nextjs-runtime.ts
export { detectProtocol }
