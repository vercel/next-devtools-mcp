import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-runtime-prefetching",
  title: "Cache Components Runtime Prefetching",
  description: "Prefetch configuration and stale time rules",
}

export default function handler() {
  return readResourceFile("(cache-components)/04-runtime-prefetching.md")
}

