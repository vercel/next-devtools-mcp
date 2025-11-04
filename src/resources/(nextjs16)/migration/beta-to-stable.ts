import { readResourceFile } from "../../../_internal/resource-path.js"

export const metadata = {
  uri: "nextjs16://migration/beta-to-stable",
  name: "nextjs16-migration-beta-to-stable",
  title: "Next.js 16 Beta to Stable Migration",
  description: "Complete guide for migrating from Next.js 16 beta to stable release",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(nextjs16)/migration/nextjs-16-beta-to-stable.md")
}
