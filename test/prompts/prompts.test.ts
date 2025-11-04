import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import { handler as getEnableCacheComponentsPrompt } from '../../src/prompts/enable-cache-components.js'
import { handler as getUpgradeNextjs16Prompt } from '../../src/prompts/upgrade-nextjs-16.js'

const REPO_ROOT = join(__dirname, '../..')
const CHARS_PER_TOKEN = 4

describe('Prompts Token Size', () => {
  it('should build successfully', () => {
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' })
  })

  it('enable-cache-components should be less than 15000 tokens', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })
    const estimatedTokens = Math.ceil(result.length / CHARS_PER_TOKEN)

    console.log(`\n📊 enable-cache-components: ${estimatedTokens.toLocaleString()} tokens (limit: 15,000)`)

    expect(estimatedTokens).toBeLessThan(15000)
  })

  it('upgrade-nextjs-16 should be less than 10000 tokens', () => {
    const result = getUpgradeNextjs16Prompt({ project_path: undefined })
    const estimatedTokens = Math.ceil(result.length / CHARS_PER_TOKEN)

    console.log(`📊 upgrade-nextjs-16: ${estimatedTokens.toLocaleString()} tokens (limit: 10,000)`)

    expect(estimatedTokens).toBeLessThan(10000)
  })

  it('upgrade-nextjs-16 should not contain unprocessed template markers', () => {
    const result = getUpgradeNextjs16Prompt({ project_path: undefined })

    // Verify all conditional blocks are processed (no leftover markers)
    expect(result).not.toContain('{{IF_BETA_CHANNEL}}')
    expect(result).not.toContain('{{/IF_BETA_CHANNEL}}')
    
    // Verify basic template variables are replaced
    expect(result).not.toContain('{{PROJECT_PATH}}')
    expect(result).not.toContain('{{UPGRADE_CHANNEL}}')
    expect(result).not.toContain('{{CODEMOD_COMMAND}}')
  })
})

