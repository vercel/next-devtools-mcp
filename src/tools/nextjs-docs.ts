import { z } from "zod"
import { type InferSchema } from "xmcp"
import { loadNumberedMarkdownFilesWithNames } from "../_internal/resource-loader"

export const schema = {
  query: z
    .string()
    .min(1, "Query parameter is required and must be a non-empty string")
    .describe("Search query to find relevant Next.js documentation sections"),
  category: z
    .enum(["all", "getting-started", "guides", "api-reference", "architecture", "community"])
    .optional()
    .describe("Filter documentation by category (optional)"),
}

export const metadata = {
  name: "nextjs_docs",
  description: `Search and retrieve Next.js official documentation.
First searches MCP resources (Next.js 16 knowledge base) for latest information, then falls back to official Next.js documentation if nothing is found.
Provides access to comprehensive Next.js guides, API references, and best practices.`,
}

let cachedDocs: { url: string; title: string; category: string }[] | null = null

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

export default async function nextjsDocs({
  query,
  category = "all",
}: InferSchema<typeof schema>): Promise<string> {
  const queryLower = query.toLowerCase()
  const mdFiles = loadNumberedMarkdownFilesWithNames()

  const matches: Array<{ filename: string; content: string; score: number }> = []

  for (const { filename, content } of mdFiles) {
    let score = 0

    if (filename.toLowerCase().includes(queryLower)) {
      score += 10
    }

    if (content.substring(0, 500).toLowerCase().includes(queryLower)) {
      score += 5
    }

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
      if (queryLower.includes(keyword) && content.toLowerCase().includes(keyword)) {
        score += 3
      }
    }

    if (score > 0) {
      matches.push({ filename, content, score })
    }
  }

  const topMatches = matches.sort((a, b) => b.score - a.score).slice(0, 3)

  if (topMatches.length > 0) {
    let result = `Found ${topMatches.length} relevant section(s) in Next.js 16 knowledge base:\n\n`

    for (const match of topMatches) {
      const title = match.filename.replace(/^\d+-/, "").replace(".md", "").replace(/-/g, " ")
      result += `## ${title}\n\n`

      const truncatedContent =
        match.content.length > 3000
          ? match.content.substring(0, 3000) + "\n\n...(truncated)"
          : match.content
      result += `${truncatedContent}\n\n`
      result += `---\n\n`
    }

    return result
  }

  const docs = await getNextJsDocs()

  let filtered = docs
  if (category !== "all") {
    filtered = docs.filter((doc) => doc.category === category)
  }

  const results = filtered
    .filter(
      (doc) =>
        doc.title?.toLowerCase().includes(queryLower) || doc.url?.toLowerCase().includes(queryLower)
    )
    .slice(0, 10)

  if (results.length === 0) {
    return `No documentation found for "${query}"${
      category !== "all" ? ` in category "${category}"` : ""
    } in both MCP resources and official Next.js documentation.`
  }

  return `No matches in MCP resources. Found ${
    results.length
  } documentation page(s) from official Next.js docs:\n\n${results
    .map((doc) => `- [${doc.title}](${doc.url})`)
    .join("\n")}`
}
