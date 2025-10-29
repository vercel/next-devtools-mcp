import { readFileSync, existsSync } from "fs"
import { join } from "path"

export interface ChannelDetectionResult {
  isBeta: boolean
  isCanary: boolean
  currentVersion: string | null
}

/**
 * Detects the Next.js channel (beta/canary/stable) from a project's package.json
 * @param projectPath - Path to the Next.js project directory
 * @returns Channel detection result with isBeta, isCanary, and currentVersion
 */
export function detectProjectChannel(projectPath: string): ChannelDetectionResult {
  const packageJsonPath = join(projectPath, "package.json")

  if (!existsSync(packageJsonPath)) {
    return { isBeta: false, isCanary: false, currentVersion: null }
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next

    if (!nextVersion) {
      return { isBeta: false, isCanary: false, currentVersion: null }
    }

    const isBeta = nextVersion.includes("beta") || nextVersion.includes("16.0.0-beta")
    const isCanary = nextVersion === "canary" || nextVersion.includes("canary")

    return { isBeta, isCanary, currentVersion: nextVersion }
  } catch (error) {
    console.warn("Failed to parse package.json, assuming not on beta/canary")
    return { isBeta: false, isCanary: false, currentVersion: null }
  }
}

/**
 * Processes conditional template blocks based on channel detection
 * Supports {{IF_BETA_CHANNEL}} blocks
 * @param template - Template string with conditional blocks
 * @param isBeta - Whether the project is on beta channel
 * @returns Processed template with conditional blocks resolved
 */
export function processConditionalBlocks(template: string, isBeta: boolean): string {
  let result = template

  // Process IF_BETA_CHANNEL blocks
  if (isBeta) {
    // Keep content, remove markers
    result = result.replace(/\{\{IF_BETA_CHANNEL\}\}/g, "")
    result = result.replace(/\{\{\/IF_BETA_CHANNEL\}\}/g, "")
  } else {
    // Remove entire block including content
    result = result.replace(/\{\{IF_BETA_CHANNEL\}\}.*?\{\{\/IF_BETA_CHANNEL\}\}/gs, "")
  }

  return result
}

