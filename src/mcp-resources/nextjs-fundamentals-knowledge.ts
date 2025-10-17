import type { Resource } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Next.js Fundamentals Knowledge Base Resources
 *
 * These resources provide comprehensive documentation about fundamental Next.js
 * concepts that are often confusing for developers, split into logical sections
 * for efficient context management.
 */

export interface FundamentalsSection {
  file: string
  uri: string
  name: string
  description: string
  mimeType: string
}

export const NEXTJS_FUNDAMENTALS_SECTIONS: FundamentalsSection[] = [
  {
    file: "01-use-client.md",
    uri: "nextjs-fundamentals://knowledge/use-client",
    name: "Understanding 'use client' Directive",
    description:
      "Learn when and why to use 'use client' in Server Components. Includes: when to mark components as client-only, why props must be serializable (functions/classes can't cross server-client boundary), composition patterns (moving 'use client' down tree, passing Server Components as children, context providers), common anti-patterns and fixes (wrapping entire app, passing functions from server), Server Actions as alternative to callbacks, React hooks that require 'use client', browser APIs, optimization checklist, and decision tree for Server vs Client components. Use this when confused about server/client boundaries, serialization errors, hydration issues, or deciding where to add 'use client'",
    mimeType: "text/markdown",
  },
]

/**
 * Convert a fundamentals section definition to an MCP Resource
 */
export function fundamentalsSectionToResource(section: FundamentalsSection): Resource {
  return {
    uri: section.uri,
    name: section.name,
    description: section.description,
    mimeType: section.mimeType,
  }
}

/**
 * Get all available Next.js fundamentals resources
 */
export function getNextjsFundamentalsResources(): Resource[] {
  return NEXTJS_FUNDAMENTALS_SECTIONS.map(fundamentalsSectionToResource)
}

/**
 * Read the content of a specific fundamentals section
 */
export function readFundamentalsSection(uri: string): string {
  const section = NEXTJS_FUNDAMENTALS_SECTIONS.find((s) => s.uri === uri)

  if (!section) {
    throw new Error(`Unknown fundamentals section: ${uri}`)
  }

  const filePath = join(__dirname, "nextjs-fundamentals-knowledge", section.file)
  return readFileSync(filePath, "utf-8")
}

/**
 * Check if a URI is a Next.js fundamentals knowledge resource
 */
export function isNextjsFundamentalsUri(uri: string): boolean {
  return uri.startsWith("nextjs-fundamentals://knowledge/")
}
