import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://advanced-patterns",
  name: "cache-components-advanced-patterns",
  title: "Cache Components Advanced Patterns",
  description: "cacheLife(), cacheTag(), draft mode and advanced caching strategies",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/08-advanced-patterns.md")
}

