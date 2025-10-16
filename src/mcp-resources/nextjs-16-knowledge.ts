import type { Resource } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Next.js 16 Knowledge Base Resources
 *
 * These resources provide comprehensive Next.js 16 documentation split into
 * logical sections for efficient context management. Each resource can be
 * loaded on-demand rather than preloading the entire knowledge base.
 */

export interface KnowledgeSection {
  file: string
  uri: string
  name: string
  description: string
  mimeType: string
}

export const NEXTJS_16_KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    file: "00-overview.md",
    uri: "nextjs16://knowledge/overview",
    name: "Next.js 16 Overview",
    description:
      "Document overview, critical errors AI agents make, and table of contents. Start here for a quick reference of common mistakes.",
    mimeType: "text/markdown",
  },
  {
    file: "01-core-mechanics.md",
    uri: "nextjs16://knowledge/core-mechanics",
    name: "Core Mechanics",
    description:
      "Part 1: Fundamental paradigm shift, how cacheComponents works, and the three types of rendering in Next.js 16.",
    mimeType: "text/markdown",
  },
  {
    file: "02-public-caches.md",
    uri: "nextjs16://knowledge/public-caches",
    name: "Public Caches",
    description:
      "Part 2: Public cache mechanics using 'use cache', cache key generation, and non-serializable props patterns.",
    mimeType: "text/markdown",
  },
  {
    file: "03-private-caches.md",
    uri: "nextjs16://knowledge/private-caches",
    name: "Private Caches",
    description:
      "Part 3: Private cache mechanics using 'use cache: private', when private cache is included/excluded, and patterns from tests.",
    mimeType: "text/markdown",
  },
  {
    file: "04-runtime-prefetching.md",
    uri: "nextjs16://knowledge/runtime-prefetching",
    name: "Runtime Prefetching",
    description:
      "Part 4: unstable_prefetch configuration, runtime prefetch patterns, what gets included in prefetch, and stale time thresholds (30s rule).",
    mimeType: "text/markdown",
  },
  {
    file: "06-request-apis.md",
    uri: "nextjs16://knowledge/request-apis",
    name: "Request APIs",
    description:
      "Part 6: Async params semantics, searchParams behavior, cookies(), headers(), and connection() API patterns.",
    mimeType: "text/markdown",
  },
  {
    file: "07-cache-invalidation.md",
    uri: "nextjs16://knowledge/cache-invalidation",
    name: "Cache Invalidation",
    description:
      "Part 7: updateTag() for read-your-own-writes, revalidateTag() with new signature, refresh() for router cache, and granular invalidation strategies.",
    mimeType: "text/markdown",
  },
  {
    file: "08-advanced-patterns.md",
    uri: "nextjs16://knowledge/advanced-patterns",
    name: "Advanced Patterns",
    description:
      "Part 8: cacheLife() profiles, cacheTag() multi-tag patterns, draft mode behavior, generateStaticParams integration, and Math.random()/Date.now() patterns.",
    mimeType: "text/markdown",
  },
  {
    file: "09-build-behavior.md",
    uri: "nextjs16://knowledge/build-behavior",
    name: "Build Behavior",
    description:
      "Part 9: What gets prerendered, resume data cache (RDC), static shell vs dynamic holes, generateMetadata and generateViewport patterns.",
    mimeType: "text/markdown",
  },
  {
    file: "10-error-patterns.md",
    uri: "nextjs16://knowledge/error-patterns",
    name: "Error Patterns",
    description:
      "Part 10: Segment config errors, dynamic metadata errors, missing suspense errors, and sync IO after dynamic API errors.",
    mimeType: "text/markdown",
  },
  {
    file: "11-test-patterns.md",
    uri: "nextjs16://knowledge/test-patterns",
    name: "Real Test-Driven Patterns",
    description:
      "Part 11: Complete E2E pattern library from 125+ test fixtures and decision trees based on actual test behavior.",
    mimeType: "text/markdown",
  },
  {
    file: "12-reference.md",
    uri: "nextjs16://knowledge/reference",
    name: "Reference Materials",
    description:
      "Mental model summary, complete API quick reference, checklists for AI agents, segment caching, generateStaticParams mechanics, and ultra-comprehensive nuances list.",
    mimeType: "text/markdown",
  },
]

/**
 * Convert a knowledge section definition to an MCP Resource
 */
export function knowledgeSectionToResource(section: KnowledgeSection): Resource {
  return {
    uri: section.uri,
    name: section.name,
    description: section.description,
    mimeType: section.mimeType,
  }
}

/**
 * Get all available Next.js 16 knowledge resources
 */
export function getNextjs16KnowledgeResources(): Resource[] {
  return NEXTJS_16_KNOWLEDGE_SECTIONS.map(knowledgeSectionToResource)
}

/**
 * Read the content of a specific knowledge section
 */
export function readKnowledgeSection(uri: string): string {
  const section = NEXTJS_16_KNOWLEDGE_SECTIONS.find((s) => s.uri === uri)

  if (!section) {
    throw new Error(`Unknown knowledge section: ${uri}`)
  }

  const filePath = join(__dirname, "nextjs-16-knowledge", section.file)
  return readFileSync(filePath, "utf-8")
}

/**
 * Check if a URI is a Next.js 16 knowledge resource
 */
export function isNextjs16KnowledgeUri(uri: string): boolean {
  return uri.startsWith("nextjs16://knowledge/")
}
