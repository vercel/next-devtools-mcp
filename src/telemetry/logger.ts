import { join } from "path"
import { existsSync, mkdirSync, appendFileSync } from "fs"
import { getTelemetryDir } from "./telemetry-dir.js"

const LOG_DIR = getTelemetryDir()
const LOG_FILE = join(LOG_DIR, "mcp.log")

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    try {
      mkdirSync(LOG_DIR, { recursive: true })
    } catch {
      // Silent fail - logging is non-critical
    }
  }
}

export function log(message: string, data?: unknown): void {
  try {
    ensureLogDir()
    const timestamp = new Date().toISOString()
    const logEntry = data
      ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`
      : `[${timestamp}] ${message}\n\n`
    appendFileSync(LOG_FILE, logEntry, "utf-8")
  } catch {
    // Silent fail - logging is non-critical
  }
}
