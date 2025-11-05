import { z } from "zod"
import { handler as getUpgradeNextjs16Prompt } from "../prompts/upgrade-nextjs-16.js"

export const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

type UpgradeNextjs16Args = z.infer<typeof inputSchema["project_path"]> extends string | undefined
  ? {
      project_path?: string
    }
  : never

export const metadata = {
  name: "upgrade_nextjs_16",
  description: `Guide through upgrading Next.js to version 16.

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
}

export async function handler(args: UpgradeNextjs16Args): Promise<string> {
  try {
    const projectPath = args.project_path || process.cwd()

    const promptText = getUpgradeNextjs16Prompt({ project_path: projectPath })

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
}
