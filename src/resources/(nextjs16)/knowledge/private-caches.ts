import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-private-caches",
  title: "Private Caches",
  description: "Private cache mechanics using 'use cache: private'",
}

export default function handler() {
  return readResourceFile("03-private-caches.md")
}
