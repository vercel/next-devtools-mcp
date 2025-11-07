import { randomBytes, createHash } from "crypto"
import { platform, arch, release } from "os"
import { join } from "path"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import type { TelemetryEvent } from "./telemetry-events.js"
import { log } from "./logger.js"
import { getTelemetryDir } from "./telemetry-dir.js"

const TELEMETRY_ENDPOINT = "https://telemetry.nextjs.org/api/v1/record"
const TELEMETRY_DIR = getTelemetryDir()
const TELEMETRY_ID_FILE = join(TELEMETRY_DIR, "telemetry-id")
const TELEMETRY_SALT_FILE = join(TELEMETRY_DIR, "telemetry-salt")

interface TelemetryPayload {
  meta: Record<string, unknown>
  context: {
    anonymousId: string
    projectId: string
    sessionId: string
  }
  events: Array<{
    eventName: string
    fields: Record<string, unknown>
  }>
}

class TelemetryStorage {
  private sessionId: string
  private anonymousId: string | null = null
  private salt: string | null = null

  constructor() {
    this.sessionId = randomBytes(16).toString("hex")
    this.ensureTelemetryDir()
  }

  private ensureTelemetryDir(): void {
    if (!existsSync(TELEMETRY_DIR)) {
      try {
        mkdirSync(TELEMETRY_DIR, { recursive: true })
      } catch {
        // Silent fail
      }
    }
  }

  private getAnonymousId(): string {
    if (this.anonymousId) {
      return this.anonymousId
    }

    try {
      if (existsSync(TELEMETRY_ID_FILE)) {
        this.anonymousId = readFileSync(TELEMETRY_ID_FILE, "utf-8").trim()
      } else {
        this.anonymousId = randomBytes(16).toString("hex")
        writeFileSync(TELEMETRY_ID_FILE, this.anonymousId, "utf-8")
      }
    } catch {
      this.anonymousId = randomBytes(16).toString("hex")
    }

    return this.anonymousId
  }

  private getSalt(): string {
    if (this.salt) {
      return this.salt
    }

    try {
      if (existsSync(TELEMETRY_SALT_FILE)) {
        this.salt = readFileSync(TELEMETRY_SALT_FILE, "utf-8").trim()
      } else {
        this.salt = randomBytes(16).toString("hex")
        writeFileSync(TELEMETRY_SALT_FILE, this.salt, "utf-8")
      }
    } catch {
      this.salt = randomBytes(16).toString("hex")
    }

    return this.salt
  }

  private oneWayHash(value: string): string {
    const hash = createHash("sha256")
    hash.update(this.getSalt())
    hash.update(value)
    return hash.digest("hex")
  }

  private getProjectId(): string {
    return this.oneWayHash(process.cwd())
  }

  private getSystemMeta(): Record<string, unknown> {
    return {
      systemPlatform: platform(),
      systemArch: arch(),
      systemRelease: release(),
      nodeVersion: process.version,
      mcpServer: "next-devtools-mcp",
    }
  }

  async sendEvents(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    const payload: TelemetryPayload = {
      meta: this.getSystemMeta(),
      context: {
        anonymousId: this.getAnonymousId(),
        projectId: this.getProjectId(),
        sessionId: this.sessionId,
      },
      events: events.map((event) => ({
        eventName: event.eventName,
        fields: event.fields,
      })),
    }

    log("TELEMETRY REQUEST", {
      endpoint: TELEMETRY_ENDPOINT,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      payload,
    })

    if (process.env.NEXT_TELEMETRY_DISABLED === "1") {
      return
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      let responseData: { status: number; statusText: string; body?: unknown } | null = null

      await this.retry(
        async () => {
          const response = await fetch(TELEMETRY_ENDPOINT, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })

          responseData = {
            status: response.status,
            statusText: response.statusText,
          }

          try {
            const text = await response.text()
            if (text) {
              try {
                responseData.body = JSON.parse(text)
              } catch {
                responseData.body = text
              }
            }
          } catch {
            // Silent fail
          }

          if (!response.ok) {
            throw new Error(`Telemetry endpoint error: ${response.statusText}`)
          }
        },
        { retries: 1, minTimeout: 500 }
      )

      clearTimeout(timeout)

      log("TELEMETRY RESPONSE (SUCCESS)", responseData)
    } catch (error) {
      log("TELEMETRY RESPONSE (ERROR)", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }

  private async retry<T>(
    fn: () => Promise<T>,
    options: { retries: number; minTimeout: number }
  ): Promise<T> {
    let lastError: Error | undefined
    for (let i = 0; i <= options.retries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < options.retries) {
          await new Promise((resolve) => setTimeout(resolve, options.minTimeout))
        }
      }
    }
    throw lastError
  }
}

export const telemetryStorage = new TelemetryStorage()
