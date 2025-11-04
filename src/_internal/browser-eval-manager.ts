import { exec } from "child_process"
import { promisify } from "util"
import { connectToMCPServer, MCPConnection } from "./mcp-client.js"

const execAsync = promisify(exec)

let browserEvalConnection: MCPConnection | null = null

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
  console.error("[Browser Eval Manager] Installing @playwright/mcp globally...")
  try {
    await execAsync("npm install -g @playwright/mcp@latest")
    console.error("[Browser Eval Manager] Successfully installed @playwright/mcp")
  } catch (error) {
    throw new Error(`Failed to install @playwright/mcp: ${error}`)
  }
}

/**
 * Ensure playwright-mcp is installed and install if needed
 */
export async function ensureBrowserEvalMCP(): Promise<void> {
  const installed = await isPlaywrightMCPInstalled()
  if (!installed) {
    await installPlaywrightMCP()
  } else {
    console.error("[Browser Eval Manager] @playwright/mcp is already installed")
  }
}

/**
 * Start playwright-mcp server and connect to it
 */
export async function startBrowserEvalMCP(options?: {
  browser?: "chrome" | "firefox" | "webkit" | "msedge"
  headless?: boolean
}): Promise<MCPConnection> {
  // Ensure playwright-mcp is installed
  await ensureBrowserEvalMCP()

  // If already connected, return existing connection
  if (browserEvalConnection) {
    console.error("[Browser Eval Manager] Using existing connection")
    return browserEvalConnection
  }

  console.error("[Browser Eval Manager] Starting playwright-mcp server with verbose logging...")

  // Build args for playwright-mcp
  const args: string[] = ["@playwright/mcp@latest"]

  if (options?.browser) {
    args.push("--browser", options.browser)
  }

  // --headless is a flag (no value needed)
  // Pass the flag only if headless is true
  if (options?.headless === true) {
    args.push("--headless")
  }

  // Always enable verbose logging via environment variables
  const env = {
    ...process.env,
    DEBUG: "pw:api,pw:browser*",
    VERBOSE: "1",
  }

  // Connect to playwright-mcp using npx
  const connection = await connectToMCPServer("npx", args, { env })

  browserEvalConnection = connection
  console.error("[Browser Eval Manager] Successfully connected to playwright-mcp (verbose mode enabled)")
  console.error("[Browser Eval Manager] Browser automation logs will be shown below:")

  return connection
}

/**
 * Get the current browser eval connection
 */
export function getBrowserEvalConnection(): MCPConnection | null {
  return browserEvalConnection
}

/**
 * Stop playwright-mcp server and cleanup
 */
export async function stopBrowserEvalMCP(): Promise<void> {
  if (!browserEvalConnection) {
    return
  }

  console.error("[Browser Eval Manager] Stopping playwright-mcp server...")

  try {
    await browserEvalConnection.transport.close()
    await browserEvalConnection.client.close()
    browserEvalConnection = null
    console.error("[Browser Eval Manager] Successfully stopped playwright-mcp")
  } catch (error) {
    console.error("[Browser Eval Manager] Error stopping playwright-mcp:", error)
    browserEvalConnection = null
    throw error
  }
}

/**
 * Cleanup on process exit
 */
process.on("SIGINT", async () => {
  await stopBrowserEvalMCP()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await stopBrowserEvalMCP()
  process.exit(0)
})

