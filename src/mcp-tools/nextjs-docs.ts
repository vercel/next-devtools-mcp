import { tool } from "ai"
import { z } from "zod"

// Next.js Docs Tool
const nextjsDocsInputSchema = z.object({
  query: z.string().describe("Search query to find relevant Next.js documentation sections"),
  category: z
    .enum(["all", "getting-started", "guides", "api-reference", "architecture", "community"])
    .optional()
    .describe("Filter documentation by category (optional)"),
})

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
Provides access to comprehensive Next.js guides, API references, and best practices.`,
  inputSchema: nextjsDocsInputSchema,
  execute: async ({
    query,
    category = "all",
  }: z.infer<typeof nextjsDocsInputSchema>): Promise<string> => {
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
      return `No documentation found for "${query}"${category !== "all" ? ` in category "${category}"` : ""}`
    }

    return `Found ${results.length} documentation page(s):\n\n${results
      .map((doc) => `- [${doc.title}](${doc.url})`)
      .join("\n")}`
  },
})

