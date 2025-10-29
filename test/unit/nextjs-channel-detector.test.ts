import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import {
  detectProjectChannel,
  processConditionalBlocks,
} from '../../src/_internal/nextjs-channel-detector'

const TEST_DIR = join(__dirname, '.test-fixtures')

describe('nextjs-channel-detector', () => {
  beforeEach(() => {
    // Create test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  describe('detectProjectChannel', () => {
    it('should detect beta channel from dependencies', () => {
      const packageJson = {
        dependencies: {
          next: '16.0.0-beta.5',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(true)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe('16.0.0-beta.5')
    })

    it('should detect beta channel with "beta" tag', () => {
      const packageJson = {
        dependencies: {
          next: 'beta',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(true)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe('beta')
    })

    it('should detect canary channel', () => {
      const packageJson = {
        dependencies: {
          next: 'canary',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(true)
      expect(result.currentVersion).toBe('canary')
    })

    it('should detect canary channel with version', () => {
      const packageJson = {
        dependencies: {
          next: '15.1.0-canary.1',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(true)
      expect(result.currentVersion).toBe('15.1.0-canary.1')
    })

    it('should detect stable channel', () => {
      const packageJson = {
        dependencies: {
          next: '16.0.0',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe('16.0.0')
    })

    it('should detect stable channel with caret', () => {
      const packageJson = {
        dependencies: {
          next: '^15.0.0',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe('^15.0.0')
    })

    it('should check devDependencies if not in dependencies', () => {
      const packageJson = {
        devDependencies: {
          next: '16.0.0-beta.3',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(true)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe('16.0.0-beta.3')
    })

    it('should return null when no next dependency exists', () => {
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
        },
      }
      writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2))

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe(null)
    })

    it('should return false when package.json does not exist', () => {
      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe(null)
    })

    it('should handle invalid JSON gracefully', () => {
      writeFileSync(join(TEST_DIR, 'package.json'), 'invalid json{{{')

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe(null)
    })

    it('should handle empty package.json', () => {
      writeFileSync(join(TEST_DIR, 'package.json'), '{}')

      const result = detectProjectChannel(TEST_DIR)

      expect(result.isBeta).toBe(false)
      expect(result.isCanary).toBe(false)
      expect(result.currentVersion).toBe(null)
    })
  })

  describe('processConditionalBlocks', () => {
    it('should show IF_BETA_CHANNEL content when isBeta is true', () => {
      const template = `
Start
{{IF_BETA_CHANNEL}}Beta content here
{{/IF_BETA_CHANNEL}}End
`

      const result = processConditionalBlocks(template, true)

      expect(result).toContain('Beta content here')
      expect(result).not.toContain('{{IF_BETA_CHANNEL}}')
      expect(result).not.toContain('{{/IF_BETA_CHANNEL}}')
    })

    it('should hide IF_BETA_CHANNEL content when isBeta is false', () => {
      const template = `
Start
{{IF_BETA_CHANNEL}}Beta content here
{{/IF_BETA_CHANNEL}}End
`

      const result = processConditionalBlocks(template, false)

      expect(result).not.toContain('Beta content here')
      expect(result).not.toContain('{{IF_BETA_CHANNEL}}')
      expect(result).not.toContain('{{/IF_BETA_CHANNEL}}')
      expect(result).toContain('Start')
      expect(result).toContain('End')
    })

    it('should handle multiple conditional blocks', () => {
      const template = `
Start
{{IF_BETA_CHANNEL}}Beta 1
{{/IF_BETA_CHANNEL}}Middle
{{IF_BETA_CHANNEL}}Beta 2
{{/IF_BETA_CHANNEL}}End
`

      const result = processConditionalBlocks(template, true)

      expect(result).toContain('Beta 1')
      expect(result).toContain('Beta 2')
      expect(result).toContain('Middle')
      expect(result).not.toContain('{{IF_BETA_CHANNEL}}')
    })

    it('should handle multiline content within blocks', () => {
      const template = `
Start
{{IF_BETA_CHANNEL}}Line 1
Line 2
Line 3{{/IF_BETA_CHANNEL}}End
`

      const result = processConditionalBlocks(template, true)

      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
      expect(result).toContain('Line 3')
      expect(result).not.toContain('{{IF_BETA_CHANNEL}}')
    })

    it('should handle inline conditional blocks', () => {
      const template = 'Start {{IF_BETA_CHANNEL}}[ ] Beta task{{/IF_BETA_CHANNEL}}[ ] Normal task'

      const resultWithBeta = processConditionalBlocks(template, true)
      expect(resultWithBeta).toContain('[ ] Beta task')
      expect(resultWithBeta).toContain('[ ] Normal task')

      const resultWithoutBeta = processConditionalBlocks(template, false)
      expect(resultWithoutBeta).not.toContain('[ ] Beta task')
      expect(resultWithoutBeta).toContain('[ ] Normal task')
    })

    it('should handle empty conditional blocks', () => {
      const template = 'Start {{IF_BETA_CHANNEL}}{{/IF_BETA_CHANNEL}}End'

      const result = processConditionalBlocks(template, true)

      expect(result).toBe('Start End')
    })

    it('should preserve content outside conditional blocks', () => {
      const template = `
Before
{{IF_BETA_CHANNEL}}Beta content
{{/IF_BETA_CHANNEL}}After
Regular content
`

      const result = processConditionalBlocks(template, false)

      expect(result).toContain('Before')
      expect(result).toContain('After')
      expect(result).toContain('Regular content')
      expect(result).not.toContain('Beta content')
    })
  })
})

