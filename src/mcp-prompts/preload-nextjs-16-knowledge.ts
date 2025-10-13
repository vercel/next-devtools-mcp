import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const preloadNextjs16KnowledgePrompt: Prompt = {
  name: "preload-nextjs-16-knowledge",
  description:
    "Preload comprehensive Next.js 16 knowledge into the context window. Includes detailed information about breaking changes, migration strategies, API updates, and best practices for upgrading to Next.js 16.",
  arguments: [],
}

export function getPreloadNextjs16KnowledgePrompt(): GetPromptResult {
  const docsPath = join(__dirname, "nextjs-16.md")
  const docsContent = readFileSync(docsPath, "utf-8")

  return {
    description: preloadNextjs16KnowledgePrompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a Next.js expert assistant with comprehensive knowledge of Next.js 16.

The following documentation contains detailed information about Next.js 16 breaking changes, migration strategies, and best practices. Please read and understand this documentation thoroughly, as it will be referenced in subsequent conversations.

# Official announcement
https://nextjs.org/blog/next-16-beta

# Next.js 16 Knowledge Base

${docsContent}

---

You now have comprehensive knowledge about Next.js 16 loaded in your context. You can reference this information when helping users with:
- Upgrading from Next.js 15 to 16
- Understanding breaking changes
- Debugging migration issues
- Implementing best practices
- Answering specific questions about Next.js 16 features

Please acknowledge that you have loaded this knowledge base.`,
        },
      },
    ],
  }
}

