import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mkdtempSync, cpSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { config } from 'dotenv'
import { handler as upgradeNextjs16Prompt } from '../../src/prompts/upgrade-nextjs-16.js'

config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') })

// E2E tests need longer timeouts
vi.setConfig({ testTimeout: 600000, hookTimeout: 60000 })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '../..')
const FIXTURE_PATH = join(REPO_ROOT, 'test/fixtures/nextjs14-minimal')
const MCP_SERVER_PATH = join(REPO_ROOT, 'dist/index.js')

describe('Next.js 14 → 16 Upgrade via MCP', () => {
  let tmpProjectDir: string

  beforeAll(() => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required. Get your API key from: https://console.anthropic.com/')
    }

    console.log('Building MCP server...')
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' })
  })

  afterAll(() => {
    if (tmpProjectDir) {
      console.log('Cleaning up temp directory...')
      rmSync(tmpProjectDir, { recursive: true, force: true })
    }
  })

  it('should upgrade Next.js 14 project to Next.js 16 using Claude Agent SDK', async () => {
    tmpProjectDir = mkdtempSync(join(tmpdir(), 'nextjs-upgrade-test-'))
    console.log(`Test directory: ${tmpProjectDir}`)

    console.log('Copying fixture to temp directory...')
    cpSync(FIXTURE_PATH, tmpProjectDir, { recursive: true })

    console.log('Installing dependencies in fixture...')
    execSync('pnpm install', { cwd: tmpProjectDir, stdio: 'inherit' })

    console.log('Building fixture as sanity check...')
    execSync('pnpm build', { cwd: tmpProjectDir, stdio: 'inherit' })

    console.log('✅ Fixture project is valid!\n')

    console.log('Loading upgrade prompt from MCP server...')
    const upgradePrompt = upgradeNextjs16Prompt({ project_path: tmpProjectDir })

    console.log('Running Claude Agent with upgrade instructions...')

    let aiResponse = ''
    let msgCount = 0

    console.log('Starting Claude Agent query...\n')
    for await (const msg of query({
      prompt: upgradePrompt,
      options: {
        workingDirectory: tmpProjectDir,
        maxTurns: 50,
        allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep']
      }
    })) {
      msgCount++

      if (msg.type === 'system') {
        console.log(`\n[${msgCount}] 🔧 System Init`)
      } else if (msg.type === 'assistant') {
        const content = msg.message?.content?.[0]
        if (content?.type === 'text') {
          console.log(`\n[${msgCount}] 💬 AI: ${content.text.substring(0, 150)}...`)
        } else if (content?.type === 'tool_use') {
          const inputStr = JSON.stringify(content.input, null, 2)
          console.log(`\n[${msgCount}] 🔨 Tool: ${content.name}`)
          console.log(`   Input: ${inputStr.substring(0, 200)}${inputStr.length > 200 ? '...' : ''}`)
        }
      } else if (msg.type === 'user') {
        const toolResult = msg.message?.content?.[0]
        if (toolResult?.type === 'tool_result') {
          const resultStr = typeof toolResult.content === 'string'
            ? toolResult.content
            : JSON.stringify(toolResult.content)
          console.log(`\n[${msgCount}] ✅ Tool Result: ${resultStr.substring(0, 200)}${resultStr.length > 200 ? '...' : ''}`)
        }
      }
    }
    console.log(`\n✅ Completed after ${msgCount} messages\n`)

    console.log('Verifying package.json has Next.js 16...')
    const packageJson = JSON.parse(
      readFileSync(join(tmpProjectDir, 'package.json'), 'utf-8')
    )
    expect(packageJson.dependencies.next).toMatch(/^[\^~]?16\./)

    console.log('Running pnpm install...')
    execSync('pnpm install', { cwd: tmpProjectDir, stdio: 'inherit' })

    console.log('Building upgraded project...')
    execSync('pnpm build', { cwd: tmpProjectDir, stdio: 'inherit' })

    console.log('Test passed!')
  }, 600000)
})
