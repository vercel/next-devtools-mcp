import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-core-mechanics",
  title: "Cache Components Core Mechanics",
  description: "Fundamental paradigm shift and cacheComponents behavior",
}

export default function handler() {
  return readResourceFile("(cache-components)/01-core-mechanics.md")
}

