import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-public-caches",
  title: "Cache Components Public Caches",
  description: "Public cache mechanics using 'use cache'",
}

export default function handler() {
  return readResourceFile("(cache-components)/02-public-caches.md")
}

