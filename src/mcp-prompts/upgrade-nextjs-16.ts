import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"
import { readBetaToStableGuide } from "../mcp-resources/nextjs-16-beta-to-stable.js"

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
 * Check if Next.js 16 is available and on which channel
 * 
 * This function checks npm registry to determine:
 * - If Next.js 16 is on the 'latest' channel (stable release) → use stable workflow
 * - If Next.js 16 is only on the 'beta' channel → use beta workflow with beta-to-stable migration guide
 * - If Next.js 16 is not available on either channel → still return latest (fallback)
 * 
 * The workflow adapts based on the channel:
 * - Stable: Uses `upgrade latest`, no beta-to-stable migration needed
 * - Beta: Uses `upgrade beta`, includes beta-to-stable migration guide for when stable is released
 * 
 * @returns { channel: 'latest' | 'beta' | 'none', version: string }
 */
function checkNextjs16Availability(): { channel: 'latest' | 'beta' | 'none', version: string } {
  try {
    // Check latest channel first
    const latestVersion = execSync('npm view next version', { encoding: 'utf-8' }).trim()
    const latestMajorMatch = latestVersion.match(/^(\d+)\./)
    const latestMajor = latestMajorMatch ? parseInt(latestMajorMatch[1], 10) : 0
    
    if (latestMajor >= 16) {
      return { channel: 'latest', version: latestVersion }
    }
    
    // Check beta channel if latest doesn't have v16
    const betaVersion = execSync('npm view next@beta version', { encoding: 'utf-8' }).trim()
    const betaMajorMatch = betaVersion.match(/^(\d+)\./)
    const betaMajor = betaMajorMatch ? parseInt(betaMajorMatch[1], 10) : 0
    
    if (betaMajor >= 16) {
      return { channel: 'beta', version: betaVersion }
    }
    
    // v16 not available yet (shouldn't happen, but handle it)
    return { channel: 'none', version: latestVersion }
  } catch (error) {
    // If npm view fails (network error, npm not installed, etc.), default to latest channel
    console.warn('Failed to check Next.js version from npm registry, defaulting to latest channel assumption')
    return { channel: 'latest', version: 'unknown' }
  }
}

export function getUpgradeNextjs16Prompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()

  // Check which channel has Next.js 16
  const { channel, version } = checkNextjs16Availability()
  const isBetaChannel = channel === 'beta'
  const upgradeChannel = isBetaChannel ? 'beta' : 'latest'
  
  // TEMPORARY: Set to false once Next.js 16 supports experimental.cacheComponents
  // For beta channel, always require canary for advanced caching features
  const REQUIRES_CANARY_FOR_CACHE_COMPONENTS = isBetaChannel

  // Generate codemod command note
  const codemodCommandNote = isBetaChannel 
    ? `**Note**: Next.js 16 is currently only available on the **beta** channel (version ${version}). The codemod will install the beta version.\n\nWhen Next.js 16 stable is released, you'll need to run the beta-to-stable migration (see Phase 3, section I).`
    : `**Note**: Next.js 16 is available on the **stable** channel (version ${version}).`

  // Load critical rules (always embedded)
  const criticalRules = readFileSync(join(__dirname, "nextjs-16-critical-rules.md"), "utf-8")

  // Load beta-to-stable migration guide (only needed when using beta channel)
  const betaToStableGuide = isBetaChannel ? readBetaToStableGuide() : ""

  // Load prompt template
  let promptTemplate = readFileSync(join(__dirname, "upgrade-nextjs-16-prompt.md"), "utf-8")

  // Replace sentinel values
  promptTemplate = promptTemplate.replace(/{{PROJECT_PATH}}/g, projectPath)
  promptTemplate = promptTemplate.replace(/{{CRITICAL_RULES}}/g, criticalRules)
  promptTemplate = promptTemplate.replace(/{{BETA_TO_STABLE_GUIDE}}/g, betaToStableGuide)
  promptTemplate = promptTemplate.replace(/{{UPGRADE_CHANNEL}}/g, upgradeChannel)
  promptTemplate = promptTemplate.replace(/{{CODEMOD_COMMAND}}/g, codemodCommandNote)

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

  // Handle beta channel conditional blocks
  if (isBetaChannel) {
    promptTemplate = promptTemplate.replace(/{{IF_BETA_CHANNEL}}/g, "")
    promptTemplate = promptTemplate.replace(/{{\/IF_BETA_CHANNEL}}/g, "")
  } else {
    promptTemplate = promptTemplate.replace(
      /{{IF_BETA_CHANNEL}}[\s\S]*?{{\/IF_BETA_CHANNEL}}\n?/g,
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
