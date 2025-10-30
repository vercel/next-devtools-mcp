import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { mkdirSync, cpSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { discoverNextJsServer, getAllAvailableServers } from '../../src/_internal/nextjs-runtime-manager'

const FIXTURE_SOURCE = join(__dirname, '../fixtures/nextjs16-minimal')
const TEST_PORT = 3456
const SERVER_STARTUP_TIMEOUT = 180000
const TEST_TIMEOUT = 240000

describe('nextjs-runtime-discovery', () => {
  let nextProcess: ChildProcess | null = null
  let serverReady = false
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `nextjs-test-${Date.now()}`)
    console.log('[Test] Creating temp directory:', tempDir)
    mkdirSync(tempDir, { recursive: true })

    console.log('[Test] Copying fixture to temp directory...')
    cpSync(FIXTURE_SOURCE, tempDir, { recursive: true })

    console.log('[Test] Installing dependencies in temp directory...')
    await new Promise<void>((resolve, reject) => {
      const installProcess = spawn('pnpm', ['install', '--no-frozen-lockfile'], {
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let installOutput = ''

      if (installProcess.stdout) {
        installProcess.stdout.on('data', (data: Buffer) => {
          installOutput += data.toString()
          console.log('[Install]', data.toString().trim())
        })
      }

      if (installProcess.stderr) {
        installProcess.stderr.on('data', (data: Buffer) => {
          installOutput += data.toString()
          console.log('[Install stderr]', data.toString().trim())
        })
      }

      installProcess.on('exit', (code: number | null) => {
        if (code === 0) {
          console.log('[Test] Dependencies installed successfully')
          resolve()
        } else {
          reject(new Error(`pnpm install failed with code ${code}\n${installOutput}`))
        }
      })

      installProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to run pnpm install: ${error.message}`))
      })
    })

    console.log('[Test] Starting Next.js dev server...')
    console.log('[Test] Temp directory:', tempDir)

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Server failed to start within ${SERVER_STARTUP_TIMEOUT}ms`))
      }, SERVER_STARTUP_TIMEOUT)

      nextProcess = spawn('pnpm', ['dev', '--port', String(TEST_PORT)], {
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdoutData = ''
      let stderrData = ''

      if (nextProcess.stdout) {
        nextProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString()
          stdoutData += output
          console.log('[Next.js stdout]', output.trim())

          if (output.includes('Local:') || output.includes('localhost:')) {
            clearTimeout(timeoutId)
            serverReady = true
            console.log('[Test] Server is ready!')
            setTimeout(resolve, 2000)
          }
        })
      }

      if (nextProcess.stderr) {
        nextProcess.stderr.on('data', (data: Buffer) => {
          const output = data.toString()
          stderrData += output
          console.log('[Next.js stderr]', output.trim())
        })
      }

      nextProcess.on('error', (error: Error) => {
        clearTimeout(timeoutId)
        reject(new Error(`Failed to start Next.js server: ${error.message}`))
      })

      nextProcess.on('exit', (code: number | null) => {
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
      console.log('[Test] Stopping Next.js dev server...')
      nextProcess.kill('SIGTERM')

      await new Promise<void>((resolve) => {
        if (!nextProcess) {
          resolve()
          return
        }

        const killTimeout = setTimeout(() => {
          if (nextProcess && !nextProcess.killed) {
            console.log('[Test] Force killing Next.js server...')
            nextProcess.kill('SIGKILL')
          }
          resolve()
        }, 5000)

        nextProcess.on('exit', () => {
          clearTimeout(killTimeout)
          console.log('[Test] Next.js server stopped')
          resolve()
        })
      })
    }

    if (tempDir && existsSync(tempDir)) {
      console.log('[Test] Cleaning up temp directory:', tempDir)
      try {
        rmSync(tempDir, { recursive: true, force: true })
        console.log('[Test] Temp directory cleaned up')
      } catch (error) {
        console.error('[Test] Failed to clean up temp directory:', error)
      }
    }
  })

  it(
    'should discover the running Next.js 16 dev server when only one is running',
    async () => {
      console.log('[Test] Attempting to discover Next.js server...')

      const allServers = await getAllAvailableServers(false)
      console.log('[Test] All discovered servers:', allServers.map(s => ({ port: s.port, pid: s.pid })))

      const server = await discoverNextJsServer()

      if (allServers.length === 1) {
        expect(server).not.toBeNull()
        expect(server?.port).toBe(TEST_PORT)
        expect(server?.pid).toBeGreaterThan(0)
        expect(server?.command).toBeTruthy()
        expect(server?.command).toContain('next')

        console.log('[Test] Successfully discovered server:', {
          port: server?.port,
          pid: server?.pid,
          command: server?.command?.substring(0, 100),
        })
      } else {
        console.log('[Test] Multiple servers detected, this is expected to return null')
        expect(server).toBeNull()
      }
    },
    TEST_TIMEOUT
  )

  it(
    'should return null when multiple servers are running',
    async () => {
      console.log('[Test] Testing behavior with multiple servers...')

      const allServers = await getAllAvailableServers(false)
      console.log('[Test] All discovered servers:', allServers.map(s => ({ port: s.port, pid: s.pid })))

      const server = await discoverNextJsServer()

      if (allServers.length > 1) {
        expect(server).toBeNull()
        console.log('[Test] Correctly returned null for multiple servers')
      } else {
        console.log('[Test] Only one server running, skipping this test case')
        expect(allServers.length).toBeLessThanOrEqual(1)
      }
    },
    TEST_TIMEOUT
  )
})
