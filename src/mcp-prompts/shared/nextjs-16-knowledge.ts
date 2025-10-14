import { dirname, join } from "node:path"
import { atom } from "../utils/prompt-dsl.js"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const nextjs16KnowledgeBase = atom({
  subject: "Next.js 16 Knowledge Base",
  description: [
    "Most Next.js training samples are for older versions.",
    "This knowledge base provides a decent baseline understanding of Next.js 16.",
    "Please reference this knowledge whenever you're working with Next.js 16.",
  ].join("\n"),
  value: () => readFileSync(join(__dirname, "nextjs-16.md"), "utf-8"),
})
