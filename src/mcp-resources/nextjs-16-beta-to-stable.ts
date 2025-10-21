import type { Resource } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Next.js 16 Beta to Stable Migration Resource
 *
 * This resource provides specific guidance for upgrading from Next.js 16 beta
 * to Next.js 16 stable, covering config migrations and breaking changes that
 * happened between beta and stable releases.
 */

const BETA_TO_STABLE_RESOURCE: Resource = {
  uri: "nextjs16://migration/beta-to-stable",
  name: "Next.js 16 Beta to Stable Migration",
  description:
    "Specific breaking changes and config migrations required when upgrading from Next.js 16 beta to stable (experimental.cacheLife → cacheLife, etc.)",
  mimeType: "text/markdown",
}

/**
 * Get the beta-to-stable migration resource
 */
export function getBetaToStableResource(): Resource {
  return BETA_TO_STABLE_RESOURCE
}

/**
 * Read the beta-to-stable migration guide content
 */
export function readBetaToStableGuide(): string {
  const filePath = join(__dirname, "nextjs-16-beta-to-stable.md")
  return readFileSync(filePath, "utf-8")
}

/**
 * Check if a URI is the beta-to-stable migration resource
 */
export function isBetaToStableUri(uri: string): boolean {
  return uri === BETA_TO_STABLE_RESOURCE.uri
}
