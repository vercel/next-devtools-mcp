import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-advanced-patterns",
  title: "Cache Components Advanced Patterns",
  description: "cacheLife(), cacheTag(), draft mode and advanced caching strategies",
}

export default function handler() {
  return readResourceFile("(cache-components)/08-advanced-patterns.md")
}

