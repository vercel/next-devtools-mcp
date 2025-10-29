import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-migration-beta-to-stable",
  title: "Next.js 16 Beta to Stable Migration",
  description: "Complete guide for migrating from Next.js 16 beta to stable release",
}

export default function handler() {
  return readResourceFile("(nextjs16)/migration/nextjs-16-beta-to-stable.md")
}
