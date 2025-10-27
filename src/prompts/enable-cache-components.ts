import { type InferSchema, type PromptMetadata } from "xmcp"
import { z } from "zod"
import { readResourceFile } from "../_internal/resource-path"
import { loadKnowledgeResources } from "../_internal/resource-loader"

export const schema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

export const metadata: PromptMetadata = {
  name: "enable-cache-components",
  title: "enable-cache-components",
  description:
    "Complete Cache Components setup for Next.js 16. Handles ALL steps: updates experimental.cacheComponents flag, removes incompatible flags, migrates Route Segment Config, starts dev server with MCP, detects all errors via chrome_devtools + get_errors, automatically fixes all issues by adding Suspense boundaries, 'use cache' directives, generateStaticParams, cacheLife profiles, cache tags, and validates everything with zero errors.",
  role: "user",
}

export default function getEnableCacheComponentsPrompt(args: InferSchema<typeof schema>): string {
  const projectPath = args.project_path || process.cwd()

  let promptTemplate = readResourceFile("enable-cache-components-prompt.md")

  const resources = loadKnowledgeResources()

  function toTitleCase(camelCase: string): string {
    return camelCase
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  const resourceEntries = Object.entries(resources)
    .map(
      ([key, content], index) => `
## 📚 Resource ${index + 1}: ${toTitleCase(key)}
${content}

---`
    )
    .join("\n")

  const embeddedKnowledge = `
# ═══════════════════════════════════════════════════════════════════
# EMBEDDED KNOWLEDGE BASE (Preloaded for Cache Components Enablement)
# ═══════════════════════════════════════════════════════════════════
${resourceEntries}

# ═══════════════════════════════════════════════════════════════════
# END OF KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════════
`

  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)

  const insertionPoint = promptTemplate.indexOf("---\n\n# ENABLE WORKFLOW:")
  if (insertionPoint !== -1) {
    promptTemplate =
      promptTemplate.slice(0, insertionPoint) +
      embeddedKnowledge +
      "\n" +
      promptTemplate.slice(insertionPoint)
  }

  return promptTemplate
}
