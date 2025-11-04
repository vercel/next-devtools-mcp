import { readResourceFile } from "../../../_internal/resource-path.js"

export const metadata = {
  uri: "nextjs16://migration/examples",
  name: "nextjs16-migration-examples",
  title: "Next.js 16 Migration Examples",
  description: "Real-world examples of migrating to Next.js 16",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(nextjs16)/migration/nextjs-16-migration-examples.md")
}
