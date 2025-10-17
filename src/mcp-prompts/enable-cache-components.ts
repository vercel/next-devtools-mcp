import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { join } from "path"

export const enableCacheComponentsPrompt: Prompt = {
  name: "enable-cache-components",
  description:
    "Complete Cache Components setup for Next.js 16. Handles ALL steps: updates experimental.cacheComponents flag, removes incompatible flags, migrates Route Segment Config, starts dev server with MCP, detects all errors via chrome_devtools + get_errors, automatically fixes all issues by adding Suspense boundaries, 'use cache' directives, generateStaticParams, cacheLife profiles, cache tags, and validates everything with zero errors.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (defaults to current directory)",
      required: false,
    },
  ],
}

export function getEnableCacheComponentsPrompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()

  // Load prompt template
  let promptTemplate = readFileSync(join(__dirname, "enable-cache-components-prompt.md"), "utf-8")

  // Load ALL knowledge resources upfront (critical for Cache Components enablement)
  const knowledgeDir = join(__dirname, "../mcp-resources/nextjs-16-knowledge")
  const resources = {
    overview: readFileSync(join(knowledgeDir, "00-overview.md"), "utf-8"),
    coreMechanics: readFileSync(join(knowledgeDir, "01-core-mechanics.md"), "utf-8"),
    publicCaches: readFileSync(join(knowledgeDir, "02-public-caches.md"), "utf-8"),
    privateCaches: readFileSync(join(knowledgeDir, "03-private-caches.md"), "utf-8"),
    runtimePrefetching: readFileSync(join(knowledgeDir, "04-runtime-prefetching.md"), "utf-8"),
    requestApis: readFileSync(join(knowledgeDir, "06-request-apis.md"), "utf-8"),
    cacheInvalidation: readFileSync(join(knowledgeDir, "07-cache-invalidation.md"), "utf-8"),
    advancedPatterns: readFileSync(join(knowledgeDir, "08-advanced-patterns.md"), "utf-8"),
    buildBehavior: readFileSync(join(knowledgeDir, "09-build-behavior.md"), "utf-8"),
    errorPatterns: readFileSync(join(knowledgeDir, "10-error-patterns.md"), "utf-8"),
    testPatterns: readFileSync(join(knowledgeDir, "11-test-patterns.md"), "utf-8"),
    reference: readFileSync(join(knowledgeDir, "12-reference.md"), "utf-8"),
  }

  // Build embedded knowledge section
  const embeddedKnowledge = `
# ═══════════════════════════════════════════════════════════════════
# EMBEDDED KNOWLEDGE BASE (Preloaded for Cache Components Enablement)
# ═══════════════════════════════════════════════════════════════════

## 📚 Resource 1: Overview - Critical Errors and Quick Reference
${resources.overview}

---

## 📚 Resource 2: Core Mechanics - Fundamental Paradigm Shift
${resources.coreMechanics}

---

## 📚 Resource 3: Public Caches - 'use cache' Mechanics
${resources.publicCaches}

---

## 📚 Resource 4: Private Caches - 'use cache: private' Mechanics
${resources.privateCaches}

---

## 📚 Resource 5: Runtime Prefetching - Dynamic Prefetch Patterns
${resources.runtimePrefetching}

---

## 📚 Resource 6: Request APIs - Async params, cookies, headers
${resources.requestApis}

---

## 📚 Resource 7: Cache Invalidation - updateTag, revalidateTag
${resources.cacheInvalidation}

---

## 📚 Resource 8: Advanced Patterns - cacheLife, cacheTag, Draft Mode
${resources.advancedPatterns}

---

## 📚 Resource 9: Build Behavior - Static Generation & Build-time
${resources.buildBehavior}

---

## 📚 Resource 10: Error Patterns - Common Errors & Solutions
${resources.errorPatterns}

---

## 📚 Resource 11: Test Patterns - Real Test-Driven Examples
${resources.testPatterns}

---

## 📚 Resource 12: Complete Reference - Mental Model & API Summary
${resources.reference}

---

# ═══════════════════════════════════════════════════════════════════
# END OF KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════════
`

  // Replace sentinel values
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)
  
  // Insert embedded knowledge right after the resource list
  const insertionPoint = promptTemplate.indexOf("---\n\n# ENABLE WORKFLOW:")
  if (insertionPoint !== -1) {
    promptTemplate = 
      promptTemplate.slice(0, insertionPoint) +
      embeddedKnowledge + "\n" +
      promptTemplate.slice(insertionPoint)
  }

  return {
    description: enableCacheComponentsPrompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: promptTemplate,
        },
      },
    ],
  }
}
