import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-advanced-patterns",
  title: "Advanced Patterns",
  description: "cacheLife(), cacheTag(), draft mode, and advanced patterns",
}

export default function handler() {
  return readResourceFile("08-advanced-patterns.md")
}
