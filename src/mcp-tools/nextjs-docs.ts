import { tool } from "ai"
import { z } from "zod"
import {
  NEXTJS_16_KNOWLEDGE_SECTIONS,
  readKnowledgeSection,
  type KnowledgeSection,
} from "../mcp-resources/nextjs-16-knowledge.js"

// Next.js Docs Tool
const nextjsDocsInputSchema = z.object({
  query: z.string().describe("Search query to find relevant Next.js documentation sections"),
  category: z
    .enum(["all", "getting-started", "guides", "api-reference", "architecture", "community"])
    .optional()
    .describe("Filter documentation by category (optional)"),
})

let cachedDocs: { url: string; title: string; category: string }[] | null = null

/**
 * Search through MCP resources (Next.js 16 knowledge sections)
 * Returns relevant sections based on query
 */
function searchMcpResources(query: string): KnowledgeSection[] {
  const queryLower = query.toLowerCase()
  const results: Array<{ section: KnowledgeSection; score: number }> = []

  for (const section of NEXTJS_16_KNOWLEDGE_SECTIONS) {
    let score = 0

    // Check if query matches section name
    if (section.name.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // Check if query matches section description
    if (section.description.toLowerCase().includes(queryLower)) {
      score += 5
    }

    // Check for keyword matches
    const keywords = [
      "cache",
      "prefetch",
      "public",
      "private",
      "revalidate",
      "invalidation",
      "async",
      "params",
      "searchParams",
      "cookies",
      "headers",
      "connection",
      "build",
      "prerender",
      "metadata",
      "error",
      "test",
      "cacheLife",
      "cacheTag",
      "updateTag",
    ]

    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        if (
          section.name.toLowerCase().includes(keyword) ||
          section.description.toLowerCase().includes(keyword)
        ) {
          score += 3
        }
      }
    }

    if (score > 0) {
      results.push({ section, score })
    }
  }

  // Sort by score and return top matches
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.section)
}

async function getNextJsDocs(): Promise<{ url: string; title: string; category: string }[]> {
  if (cachedDocs) {
    return cachedDocs
  }

  const response = await fetch("https://nextjs.org/docs/llms.txt")
  const text = await response.text()

  const linkRegex = /- \[(.*?)\]\((https:\/\/nextjs\.org\/docs\/.*?)\)/g
  const docs: { url: string; title: string; category: string }[] = []

  let match
  while ((match = linkRegex.exec(text)) !== null) {
    const title = match[1]
    const url = match[2]

    // Skip entries with undefined title or url
    if (!title || !url) {
      continue
    }

    let category = "other"
    if (url.includes("/getting-started/")) {
      category = "getting-started"
    } else if (url.includes("/guides/")) {
      category = "guides"
    } else if (url.includes("/api-reference/")) {
      category = "api-reference"
    } else if (url.includes("/architecture/")) {
      category = "architecture"
    } else if (url.includes("/community/")) {
      category = "community"
    }

    docs.push({ url, title, category })
  }

  cachedDocs = docs
  return docs
}

export const nextjsDocsTool = tool({
  description: `Search and retrieve Next.js official documentation.
First searches MCP resources (Next.js 16 knowledge base) for latest information, then falls back to official Next.js documentation if nothing is found.
Provides access to comprehensive Next.js guides, API references, and best practices.`,
  inputSchema: nextjsDocsInputSchema,
  execute: async ({
    query,
    category = "all",
  }: z.infer<typeof nextjsDocsInputSchema>): Promise<string> => {
    // Step 1: Search MCP resources first (Next.js 16 knowledge base)
    const mcpMatches = searchMcpResources(query)

    if (mcpMatches.length > 0) {
      // Found relevant content in MCP resources, return it
      let result = `Found ${mcpMatches.length} relevant section(s) in Next.js 16 knowledge base:\n\n`

      for (const section of mcpMatches) {
        result += `## ${section.name}\n\n`
        result += `${section.description}\n\n`

        try {
          const content = readKnowledgeSection(section.uri)
          // Limit content to first 3000 characters to avoid overwhelming the response
          const truncatedContent =
            content.length > 3000 ? content.substring(0, 3000) + "\n\n...(truncated)" : content
          result += `${truncatedContent}\n\n`
          result += `---\n\n`
        } catch (error) {
          result += `Error reading section: ${error instanceof Error ? error.message : String(error)}\n\n`
        }
      }

      return result
    }

    // Step 2: Fallback to official Next.js documentation
    const docs = await getNextJsDocs()

    let filtered = docs
    if (category !== "all") {
      filtered = docs.filter((doc) => doc.category === category)
    }

    const queryLower = query.toLowerCase()
    const results = filtered
      .filter(
        (doc) =>
          doc.title?.toLowerCase().includes(queryLower) ||
          doc.url?.toLowerCase().includes(queryLower)
      )
      .slice(0, 10)

    if (results.length === 0) {
      return `No documentation found for "${query}"${category !== "all" ? ` in category "${category}"` : ""} in both MCP resources and official Next.js documentation.`
    }

    return `No matches in MCP resources. Found ${results.length} documentation page(s) from official Next.js docs:\n\n${results
      .map((doc) => `- [${doc.title}](${doc.url})`)
      .join("\n")}`
  },
})

