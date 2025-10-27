import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-public-caches",
  title: "Public Caches",
  description: "Public cache mechanics using 'use cache'",
}

export default function handler() {
  return readResourceFile("02-public-caches.md")
}
