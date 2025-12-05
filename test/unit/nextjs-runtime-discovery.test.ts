import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawn, ChildProcess, execSync } from "child_process"
import { join } from "path"
import { mkdirSync, cpSync, rmSync, existsSync } from "fs"
import { tmpdir } from "os"
import { getAllAvailableServers } from "../../src/_internal/nextjs-runtime-manager"

/**
 * Kill a process tree cross-platform
 * On Windows, SIGTERM/SIGKILL don't work properly, so we use taskkill
 */
function killProcessTree(proc: ChildProcess): void {
  if (!proc.pid) return

  if (process.platform === "win32") {
    try {
      // /T kills the process tree, /F forces termination
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" })
    } catch {
      // Process may already be dead
    }
  } else {
    proc.kill("SIGTERM")
  }
}

function forceKillProcessTree(proc: ChildProcess): void {
  if (!proc.pid) return

  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" })
    } catch {
      // Process may already be dead
    }
  } else {
    proc.kill("SIGKILL")
  }
}

const FIXTURE_SOURCE = join(__dirname, "../fixtures/nextjs16-minimal")
const TEST_PORT = 3456
const SERVER_STARTUP_TIMEOUT = 180000
const TEST_TIMEOUT = 240000

describe("nextjs-runtime-discovery", () => {
  let nextProcess: ChildProcess | null = null
  let serverReady = false
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `nextjs-test-${Date.now()}`)
    console.log("[Test] Creating temp directory:", tempDir)
    mkdirSync(tempDir, { recursive: true })

    console.log("[Test] Copying fixture to temp directory...")
    cpSync(FIXTURE_SOURCE, tempDir, { recursive: true })

    console.log("[Test] Installing dependencies in temp directory...")
    await new Promise<void>((resolve, reject) => {
      const installProcess = spawn("pnpm", ["install", "--no-frozen-lockfile"], {
        cwd: tempDir,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      })

      let installOutput = ""

      if (installProcess.stdout) {
        installProcess.stdout.on("data", (data: Buffer) => {
          installOutput += data.toString()
          console.log("[Install]", data.toString().trim())
        })
      }

      if (installProcess.stderr) {
        installProcess.stderr.on("data", (data: Buffer) => {
          installOutput += data.toString()
          console.log("[Install stderr]", data.toString().trim())
        })
      }

      installProcess.on("exit", (code: number | null) => {
        if (code === 0) {
          console.log("[Test] Dependencies installed successfully")
          resolve()
        } else {
          reject(new Error(`pnpm install failed with code ${code}\n${installOutput}`))
        }
      })

      installProcess.on("error", (error: Error) => {
        reject(new Error(`Failed to run pnpm install: ${error.message}`))
      })
    })

    console.log("[Test] Starting Next.js dev server...")
    console.log("[Test] Temp directory:", tempDir)

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Server failed to start within ${SERVER_STARTUP_TIMEOUT}ms`))
      }, SERVER_STARTUP_TIMEOUT)

      nextProcess = spawn("pnpm", ["dev", "--port", String(TEST_PORT)], {
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: "development" },
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      })

      let stdoutData = ""
      let stderrData = ""

      if (nextProcess.stdout) {
        nextProcess.stdout.on("data", (data: Buffer) => {
          const output = data.toString()
          stdoutData += output
          console.log("[Next.js stdout]", output.trim())

          if (output.includes("Local:") || output.includes("localhost:")) {
            clearTimeout(timeoutId)
            serverReady = true
            console.log("[Test] Server is ready!")
            setTimeout(resolve, 2000)
          }
        })
      }

      if (nextProcess.stderr) {
        nextProcess.stderr.on("data", (data: Buffer) => {
          const output = data.toString()
          stderrData += output
          console.log("[Next.js stderr]", output.trim())
        })
      }

      nextProcess.on("error", (error: Error) => {
        clearTimeout(timeoutId)
        reject(new Error(`Failed to start Next.js server: ${error.message}`))
      })

      nextProcess.on("exit", (code: number | null) => {
        if (!serverReady) {
          clearTimeout(timeoutId)
          reject(
            new Error(
              `Next.js server exited with code ${code}\nStdout: ${stdoutData}\nStderr: ${stderrData}`
            )
          )
        }
      })
    })
  }, SERVER_STARTUP_TIMEOUT)

  afterAll(async () => {
    if (nextProcess) {
      console.log("[Test] Stopping Next.js dev server...")
      killProcessTree(nextProcess)

      await new Promise<void>((resolve) => {
        if (!nextProcess) {
          resolve()
          return
        }

        const killTimeout = setTimeout(() => {
          if (nextProcess && !nextProcess.killed) {
            console.log("[Test] Force killing Next.js server...")
            forceKillProcessTree(nextProcess)
          }
          resolve()
        }, 5000)

        nextProcess.on("exit", () => {
          clearTimeout(killTimeout)
          console.log("[Test] Next.js server stopped")
          resolve()
        })
      })
    }

    // Wait a bit for file handles to be released on Windows
    if (process.platform === "win32") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    if (tempDir && existsSync(tempDir)) {
      console.log("[Test] Cleaning up temp directory:", tempDir)
      try {
        rmSync(tempDir, { recursive: true, force: true })
        console.log("[Test] Temp directory cleaned up")
      } catch (error) {
        console.error("[Test] Failed to clean up temp directory:", error)
      }
    }
  })

  it(
    "should discover Next.js server on non-standard port via process discovery",
    async () => {
      // Port 3456 is outside the common ports range (3000-3010), so it must
      // be discovered via process discovery (findNextJsServers), not port probing
      console.log(`[Test] Discovering Next.js server on port ${TEST_PORT}...`)

      const allServers = await getAllAvailableServers()
      console.log(
        "[Test] All discovered servers:",
        allServers.map((s) => ({ port: s.port, pid: s.pid, cmd: s.command }))
      )

      const server = allServers.find((s) => s.port === TEST_PORT)

      // These assertions must pass - if they fail, process discovery is broken
      expect(server, `Server on port ${TEST_PORT} should be discovered`).toBeDefined()
      expect(server?.port).toBe(TEST_PORT)
      expect(server?.pid).toBeGreaterThan(0)
      expect(server?.command).toBeTruthy()

      console.log("[Test] Successfully discovered server:", {
        port: server?.port,
        pid: server?.pid,
        command: server?.command?.substring(0, 100),
      })
    },
    TEST_TIMEOUT
  )
})
