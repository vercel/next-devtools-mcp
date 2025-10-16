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

  // Replace sentinel values
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)

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
