import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-private-caches",
  title: "Cache Components Private Caches",
  description: "Private cache mechanics using 'use cache: private'",
}

export default function handler() {
  return readResourceFile("(cache-components)/03-private-caches.md")
}

