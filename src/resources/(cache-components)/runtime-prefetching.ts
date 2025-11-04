import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://runtime-prefetching",
  name: "cache-components-runtime-prefetching",
  title: "Cache Components Runtime Prefetching",
  description: "Prefetch configuration and stale time rules",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/04-runtime-prefetching.md")
}

