import { z } from "zod"
import { readResourceFile } from "../_internal/resource-path.js"

export const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

type EnableCacheComponentsPromptArgs = {
  project_path?: string
}

export const metadata = {
  name: "enable-cache-components",
  title: "enable-cache-components",
  description:
    "Complete Cache Components setup for Next.js 16. Handles ALL steps: updates experimental.cacheComponents flag, removes incompatible flags, migrates Route Segment Config, starts dev server with MCP, detects all errors via chrome_devtools + get_errors, automatically fixes all issues by adding Suspense boundaries, 'use cache' directives, generateStaticParams, cacheLife profiles, cache tags, and validates everything with zero errors.",
  role: "user",
}

export function handler(args: EnableCacheComponentsPromptArgs): string {
  const projectPath = args.project_path || process.cwd()

  let promptTemplate = readResourceFile("prompts/enable-cache-components-prompt.md")

  // Replace template variables
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)

  return promptTemplate
}
