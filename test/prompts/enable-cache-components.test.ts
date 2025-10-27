import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import { join } from 'path'
import getEnableCacheComponentsPrompt from '../../src/prompts/enable-cache-components'

const REPO_ROOT = join(__dirname, '../..')

describe('Enable Cache Components Prompt', () => {
  beforeAll(() => {
    console.log('Building project...')
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' })
  })

  it('should return a non-empty string', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should embed the project path correctly', () => {
    const testPath = '/test/project/path'
    const result = getEnableCacheComponentsPrompt({ project_path: testPath })

    expect(result).toContain(testPath)
  })

  it('should use current directory when no project path provided', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })
    const cwd = process.cwd()

    expect(result).toContain(cwd)
  })

  it('should embed all 12 Next.js 16 knowledge resources', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    const expectedResources = [
      'overview',
      'core-mechanics',
      'public-caches',
      'private-caches',
      'runtime-prefetching',
      'request-apis',
      'cache-invalidation',
      'advanced-patterns',
      'build-behavior',
      'error-patterns',
      'test-patterns',
      'reference'
    ]

    for (const resource of expectedResources) {
      expect(result.toLowerCase()).toContain(resource)
    }
  })

  it('should contain knowledge base section markers', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toContain('EMBEDDED KNOWLEDGE BASE')
    expect(result).toContain('END OF KNOWLEDGE BASE')
  })

  it('should contain workflow sections', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toContain('ENABLE WORKFLOW')
  })

  it('should contain resource entries with proper formatting', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toMatch(/📚 Resource \d+:/)

    expect(result).toMatch(/---/)
  })

  it('should embed actual content from knowledge files', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toContain('use cache')
    expect(result).toContain('Suspense')
    expect(result).toContain('cacheLife')
    expect(result).toContain('cacheTag')
  })

  it('should have substantial content (knowledge base embedded)', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result.length).toBeGreaterThan(10000)

    const knowledgeBaseStart = result.indexOf('EMBEDDED KNOWLEDGE BASE')
    const knowledgeBaseEnd = result.indexOf('END OF KNOWLEDGE BASE')

    expect(knowledgeBaseStart).toBeGreaterThan(-1)
    expect(knowledgeBaseEnd).toBeGreaterThan(knowledgeBaseStart)

    const knowledgeBaseContent = result.substring(knowledgeBaseStart, knowledgeBaseEnd)
    expect(knowledgeBaseContent.length).toBeGreaterThan(5000)
  })

  it('should maintain proper markdown formatting', () => {
    const result = getEnableCacheComponentsPrompt({ project_path: undefined })

    expect(result).toMatch(/^#\s+/m)
    expect(result).toMatch(/^##\s+/m)

    expect(result).toContain('```')
  })
})
