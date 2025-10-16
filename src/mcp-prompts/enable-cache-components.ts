import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { join } from "path"

export const enableCacheComponentsPrompt: Prompt = {
  name: "enable-cache-components",
  description:
    "Enable and verify Cache Components in Next.js 16. Configures experimental.cacheComponents, starts dev server with MCP enabled, verifies all routes, and fixes any errors automatically.",
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
