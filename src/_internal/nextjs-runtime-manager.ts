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

const MCP_HOST = process.env.NEXT_DEVTOOLS_HOST ?? "localhost"

/**
 * Get fetch options for HTTPS requests
 * Automatically allows insecure TLS for HTTPS (self-signed certificates)
 * Can be disabled via NODE_TLS_REJECT_UNAUTHORIZED=0
 */
function getFetchOptions(protocol: "http" | "https") {
  const allowInsecure =
    protocol === "https" && process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"

  if (protocol !== "https" || !allowInsecure) return {}

  if (!insecureHttpsAgent) {
    insecureHttpsAgent = new UndiciAgent({ connect: { rejectUnauthorized: false } })
  }
  return { dispatcher: insecureHttpsAgent }
}

/**
 * Low-level probe: send a tools/list request to a specific port and protocol
 * Returns the Response if successful, null otherwise
 */
async function probeMCPEndpoint(
  port: number,
  protocol: "http" | "https",
  timeoutMs: number = 500
): Promise<Response | null> {
  try {
    const url = `${protocol}://${MCP_HOST}:${port}/_next/mcp`
    const fetchOptions = getFetchOptions(protocol)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
    return response
  } catch {
    return null
  }
}

/**
 * Probe a port for MCP endpoint, trying both protocols
 * Returns the successful protocol if found, null otherwise
 * Also caches the detected protocol
 */
async function probePort(port: number, timeoutMs: number = 500): Promise<"http" | "https" | null> {
  // Check cache first
  if (protocolCache.has(port)) {
    const cachedProtocol = protocolCache.get(port)!
    const response = await probeMCPEndpoint(port, cachedProtocol, timeoutMs)
    if (response?.ok) {
      return cachedProtocol
    }
    // Cache might be stale, clear it and try again
    protocolCache.delete(port)
  }

  // Try HTTP first (more common for local dev)
  for (const protocol of ["http", "https"] as const) {
    const response = await probeMCPEndpoint(port, protocol, timeoutMs)
    if (response && response.status !== 404) {
      protocolCache.set(port, protocol)
      if (response.ok) {
        return protocol
      }
    }
  }

  return null
}

/**
 * Detect protocol for a port (for use when making requests)
 * Returns cached protocol or defaults to http
 */
async function detectProtocol(port: number): Promise<"http" | "https"> {
  if (protocolCache.has(port)) {
    return protocolCache.get(port)!
  }

  const protocol = await probePort(port)
  return protocol ?? "http"
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
  const protocol = await detectProtocol(port)
  const url = `${protocol}://${MCP_HOST}:${port}/_next/mcp`
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
 * Common ports to probe for Next.js dev servers
 * These are probed first before falling back to process discovery
 */
const COMMON_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010]

/**
 * Discover Next.js servers by probing common ports
 * This is more reliable than process discovery on some OS
 */
async function discoverViaPortProbing(): Promise<NextJsServerInfo[]> {
  const servers: NextJsServerInfo[] = []

  // Probe all common ports in parallel for speed
  const results = await Promise.all(
    COMMON_PORTS.map(async (port) => {
      const protocol = await probePort(port)
      if (protocol) {
        return {
          port,
          pid: 0, // PID unknown when discovered via port probing
          command: `Next.js server (discovered via port ${port})`,
        }
      }
      return null
    })
  )

  for (const result of results) {
    if (result) {
      servers.push(result)
    }
  }

  return servers
}

export async function getAllAvailableServers(): Promise<NextJsServerInfo[]> {
  const seenPorts = new Set<number>()
  const allServers: NextJsServerInfo[] = []

  // Step 1: Probe common ports first (most reliable, works on all OS)
  const portProbedServers = await discoverViaPortProbing()
  for (const server of portProbedServers) {
    if (!seenPorts.has(server.port)) {
      seenPorts.add(server.port)
      allServers.push(server)
    }
  }

  // Step 2: Also try process discovery to find servers on non-standard ports
  const processServers = await findNextJsServers()

  // Filter to servers not already found via port probing
  const newServers = processServers.filter(server => !seenPorts.has(server.port))

  // Verify MCP for process-discovered servers in parallel
  const verifiedServers = await Promise.all(
    newServers.map(async (server) => {
      const hasMCP = await probePort(server.port, 1000)
      return hasMCP ? server : null
    })
  )

  // Add verified servers
  for (const server of verifiedServers) {
    if (server) {
      allServers.push(server)
    }
  }

  return allServers
}

// Export detectProtocol, probePort, and MCP_HOST for use elsewhere
export { detectProtocol, probePort, MCP_HOST }
