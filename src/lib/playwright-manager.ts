import { exec } from "child_process"
import { promisify } from "util"
import { connectToMCPServer, MCPConnection } from "./mcp-client.js"

const execAsync = promisify(exec)

let playwrightConnection: MCPConnection | null = null

/**
 * Check if playwright-mcp is installed
 */
async function isPlaywrightMCPInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("npm list -g @playwright/mcp --depth=0")
    return stdout.includes("@playwright/mcp")
  } catch (error) {
    // npm list returns error if package not found
    return false
  }
}

/**
 * Install playwright-mcp globally
 */
async function installPlaywrightMCP(): Promise<void> {
  console.error("[Playwright Manager] Installing @playwright/mcp globally...")
  try {
    await execAsync("npm install -g @playwright/mcp@latest")
    console.error("[Playwright Manager] Successfully installed @playwright/mcp")
  } catch (error) {
    throw new Error(`Failed to install @playwright/mcp: ${error}`)
  }
}

/**
 * Ensure playwright-mcp is installed and install if needed
 */
export async function ensurePlaywrightMCP(): Promise<void> {
  const installed = await isPlaywrightMCPInstalled()
  if (!installed) {
    await installPlaywrightMCP()
  } else {
    console.error("[Playwright Manager] @playwright/mcp is already installed")
  }
}

/**
 * Start playwright-mcp server and connect to it
 */
export async function startPlaywrightMCP(options?: {
  browser?: "chrome" | "firefox" | "webkit" | "msedge"
  headless?: boolean
}): Promise<MCPConnection> {
  // Ensure playwright-mcp is installed
  await ensurePlaywrightMCP()

  // If already connected, return existing connection
  if (playwrightConnection) {
    console.error("[Playwright Manager] Using existing connection")
    return playwrightConnection
  }

  console.error("[Playwright Manager] Starting playwright-mcp server...")

  // Build args for playwright-mcp
  const args: string[] = ["@playwright/mcp@latest"]

  if (options?.browser) {
    args.push("--browser", options.browser)
  }

  if (options?.headless !== undefined) {
    args.push("--headless", String(options.headless))
  }

  // Connect to playwright-mcp using npx
  const connection = await connectToMCPServer("npx", args)

  playwrightConnection = connection
  console.error("[Playwright Manager] Successfully connected to playwright-mcp")

  return connection
}

/**
 * Get the current playwright-mcp connection
 */
export function getPlaywrightConnection(): MCPConnection | null {
  return playwrightConnection
}

/**
 * Stop playwright-mcp server and cleanup
 */
export async function stopPlaywrightMCP(): Promise<void> {
  if (!playwrightConnection) {
    return
  }

  console.error("[Playwright Manager] Stopping playwright-mcp server...")

  try {
    await playwrightConnection.transport.close()
    await playwrightConnection.client.close()
    playwrightConnection = null
    console.error("[Playwright Manager] Successfully stopped playwright-mcp")
  } catch (error) {
    console.error("[Playwright Manager] Error stopping playwright-mcp:", error)
    playwrightConnection = null
    throw error
  }
}

/**
 * Cleanup on process exit
 */
process.on("SIGINT", async () => {
  await stopPlaywrightMCP()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await stopPlaywrightMCP()
  process.exit(0)
})
