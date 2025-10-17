import { tool } from "ai"
import { z } from "zod"
import { getUpgradeNextjs16Prompt } from "../mcp-prompts/upgrade-nextjs-16.js"

/**
 * Upgrade Next.js to version 16 MCP Tool
 *
 * This tool guides through upgrading Next.js to version 16, running the official
 * codemod for automatic upgrades and handling remaining issues manually.
 */
const upgradeNextjs16InputSchema = z.object({
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
})

export const upgradeNextjs16Tool = tool({
  description: `Guide through upgrading Next.js to version 16 beta.

CRITICAL: Runs the official codemod FIRST (requires clean git state) for automatic upgrades and fixes, then handles remaining issues manually. The codemod upgrades Next.js, React, and React DOM automatically.

Covers:
- Next.js version upgrade to 16
- Async API changes (params, searchParams, cookies, headers)
- Config migration (next.config changes)
- Image defaults and optimization
- Parallel routes and dynamic segments
- Deprecated API removals
- React 19 compatibility

The codemod requires:
- Clean git working directory (commit or stash changes first)
- Node.js 18+
- npm/pnpm/yarn/bun installed

After codemod runs, provides manual guidance for any remaining issues not covered by the codemod.`,

  inputSchema: upgradeNextjs16InputSchema,

  execute: async (args: z.infer<typeof upgradeNextjs16InputSchema>): Promise<string> => {
    try {
      const projectPath = args.project_path || process.cwd()

      // Get the full prompt content
      const promptResult = getUpgradeNextjs16Prompt({ project_path: projectPath })

      // Extract the prompt text
      const promptText = promptResult.messages[0].content.type === "text"
        ? promptResult.messages[0].content.text
        : ""

      // Return the prompt as structured guidance
      return JSON.stringify({
        success: true,
        project_path: projectPath,
        description: "Next.js 16 Upgrade Guide",
        guidance: promptText,
        type: "structured_guidance",
        note: "This tool provides detailed step-by-step guidance. Follow the phases in order for successful upgrade.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return JSON.stringify({
        success: false,
        error: errorMessage,
        details: "Failed to load upgrade guidance",
      })
    }
  },
})
