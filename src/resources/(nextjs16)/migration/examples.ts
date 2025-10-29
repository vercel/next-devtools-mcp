import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-migration-examples",
  title: "Next.js 16 Migration Examples",
  description: "Real-world examples of migrating to Next.js 16",
}

export default function handler() {
  return readResourceFile("(nextjs16)/migration/nextjs-16-migration-examples.md")
}
