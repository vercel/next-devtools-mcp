import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

export const upgradeNextjs16Prompt: Prompt = {
  name: "upgrade-nextjs-16",
  description:
    "Guide through upgrading Next.js to version 16. CRITICAL: Runs the official codemod FIRST (requires clean git state) for automatic upgrades and fixes, then handles remaining issues manually. The codemod upgrades Next.js, React, and React DOM automatically. Covers async API changes, config moves, image defaults, parallel routes, and deprecations.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (defaults to current directory)",
      required: false,
    },
  ],
}

/**
 * Get the Next.js stable version
 * 
 * Since Next.js 16 stable is now released, we use the stable channel.
 * Users can optionally upgrade to canary for advanced features.
 * 
 * @returns { channel: 'latest', version: string }
 */
function checkNextjs16Availability(): { channel: 'latest', version: string } {
  try {
    const latestVersion = execSync('npm view next version', { encoding: 'utf-8' }).trim()
    return { channel: 'latest', version: latestVersion }
  } catch (error) {
    // If npm view fails (network error, npm not installed, etc.), default to latest channel
    console.warn('Failed to check Next.js version from npm registry, defaulting to latest channel assumption')
    return { channel: 'latest', version: 'unknown' }
  }
}

export function getUpgradeNextjs16Prompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()

  // Get Next.js stable version
  const { version } = checkNextjs16Availability()
  const upgradeChannel = 'latest'
  
  // Next.js 16 stable supports cacheComponents in experimental
  // Canary has it at root level - users can optionally upgrade to canary
  const REQUIRES_CANARY_FOR_CACHE_COMPONENTS = true // Optional upgrade to canary for root-level cacheComponents

  // Generate codemod command note
  const codemodCommandNote = `**Note**: Next.js 16 stable (version ${version}) is now available.`

  // Load prompt template
  let promptTemplate = readFileSync(join(__dirname, "upgrade-nextjs-16-prompt.md"), "utf-8")

  // Replace sentinel values
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)
  promptTemplate = promptTemplate.replace(/{{UPGRADE_CHANNEL}}/g, upgradeChannel)
  promptTemplate = promptTemplate.replace(/{{CODEMOD_COMMAND}}/g, codemodCommandNote)

  // Handle conditional blocks for canary upgrade (optional advanced features)
  if (REQUIRES_CANARY_FOR_CACHE_COMPONENTS) {
    promptTemplate = promptTemplate.replace(/{{IF_REQUIRES_CANARY}}\n?/g, "")
    promptTemplate = promptTemplate.replace(/\n?{{\/IF_REQUIRES_CANARY}}/g, "")
  } else {
    promptTemplate = promptTemplate.replace(
      /{{IF_REQUIRES_CANARY}}[\s\S]*?{{\/IF_REQUIRES_CANARY}}\n?/g,
      ""
    )
  }

  // Remove beta channel conditional blocks (beta is no longer used)
  promptTemplate = promptTemplate.replace(
    /{{IF_BETA_CHANNEL}}[\s\S]*?{{\/IF_BETA_CHANNEL}}\n?/g,
    ""
  )

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
