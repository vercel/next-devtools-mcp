import type { Resource } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Next.js 16 Migration Examples Resource
 *
 * This resource provides detailed code examples for all migration scenarios
 * when upgrading to Next.js 16, including removed features, async APIs,
 * config changes, and more.
 */

const MIGRATION_EXAMPLES_RESOURCE: Resource = {
  uri: "nextjs16://migration/examples",
  name: "Next.js 16 Migration Code Examples",
  description:
    "Detailed before/after code examples for all Next.js 16 migration scenarios: removed features (AMP, runtime config, PPR), async APIs, image config, cache invalidation, middleware to proxy, and more",
  mimeType: "text/markdown",
}

/**
 * Get the migration examples resource
 */
export function getMigrationExamplesResource(): Resource {
  return MIGRATION_EXAMPLES_RESOURCE
}

/**
 * Read the migration examples content
 */
export function readMigrationExamples(): string {
  const filePath = join(__dirname, "nextjs-16-migration-examples.md")
  return readFileSync(filePath, "utf-8")
}

/**
 * Check if a URI is the migration examples resource
 */
export function isMigrationExamplesUri(uri: string): boolean {
  return uri === MIGRATION_EXAMPLES_RESOURCE.uri
}

