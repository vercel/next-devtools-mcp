import { type InferSchema, type PromptMetadata } from "xmcp"
import { z } from "zod"
import { readResourceFile } from "../_internal/resource-path"
import { execSync } from "child_process"
import {
  detectProjectChannel,
  processConditionalBlocks,
} from "../_internal/nextjs-channel-detector"

export const schema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

export const metadata: PromptMetadata = {
  name: "upgrade-nextjs-16",
  title: "upgrade-nextjs-16",
  description:
    "Guide through upgrading Next.js to version 16. CRITICAL: Runs the official codemod FIRST (requires clean git state) for automatic upgrades and fixes, then handles remaining issues manually. The codemod upgrades Next.js, React, and React DOM automatically. Covers async API changes, config moves, image defaults, parallel routes, and deprecations.",
  role: "user",
}

function checkNextjs16Availability(): { channel: "latest"; version: string } {
  try {
    const latestVersion = execSync("npm view next version", { encoding: "utf-8" }).trim()
    return { channel: "latest", version: latestVersion }
  } catch (error) {
    console.warn(
      "Failed to check Next.js version from npm registry, defaulting to latest channel assumption"
    )
    return { channel: "latest", version: "unknown" }
  }
}

export default function getUpgradeNextjs16Prompt(args: InferSchema<typeof schema>): string {
  const projectPath = args.project_path || process.cwd()

  const { version } = checkNextjs16Availability()
  const upgradeChannel = "latest"
  const codemodCommandNote = `**Note**: Next.js 16 stable (version ${version}) is now available.`

  // Detect if project is on beta/canary
  const { isBeta } = detectProjectChannel(projectPath)

  let promptTemplate = readResourceFile("prompts/upgrade-nextjs-16-prompt.md")

  // Replace basic template variables
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)
  promptTemplate = promptTemplate.replace(/{{UPGRADE_CHANNEL}}/g, upgradeChannel)
  promptTemplate = promptTemplate.replace(/{{CODEMOD_COMMAND}}/g, codemodCommandNote)

  // Process conditional blocks based on project channel
  promptTemplate = processConditionalBlocks(promptTemplate, isBeta)

  return promptTemplate
}
