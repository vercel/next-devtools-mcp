import { join } from "path"
import { homedir } from "os"

/**
 * Get the telemetry directory path.
 * Returns ~/.next-devtools-mcp/
 */
export function getTelemetryDir(): string {
  const homeDir = homedir()
  return join(homeDir, ".next-devtools-mcp")
}
