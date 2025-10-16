import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { join } from "path"

export const upgradeNextjs16Prompt: Prompt = {
  name: "upgrade-nextjs-16",
  description:
    "Guide through upgrading Next.js to version 16 beta. Runs the official codemod first for automatic fixes, then handles remaining issues manually. Covers async API changes, config moves, image defaults, parallel routes, and deprecations.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (defaults to current directory)",
      required: false,
    },
  ],
}

export function getUpgradeNextjs16Prompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()

  // TEMPORARY: Set to false once Next.js 16 beta supports experimental.cacheComponents
  const REQUIRES_CANARY_FOR_CACHE_COMPONENTS = true

  // Load prompt template
  let promptTemplate = readFileSync(join(__dirname, "upgrade-nextjs-16-prompt.md"), "utf-8")

  // Replace sentinel values
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)

  // Handle conditional blocks
  if (REQUIRES_CANARY_FOR_CACHE_COMPONENTS) {
    promptTemplate = promptTemplate.replace(/{{IF_REQUIRES_CANARY}}\n?/g, "")
    promptTemplate = promptTemplate.replace(/\n?{{\/IF_REQUIRES_CANARY}}/g, "")
  } else {
    promptTemplate = promptTemplate.replace(
      /{{IF_REQUIRES_CANARY}}[\s\S]*?{{\/IF_REQUIRES_CANARY}}\n?/g,
      ""
    )
  }

  return {
    description: upgradeNextjs16Prompt.description,
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
