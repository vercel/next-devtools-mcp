import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-overview",
  title: "Next.js 16 Overview",
  description: "Document overview, critical errors AI agents make, and table of contents",
}

export default function handler() {
  return readResourceFile("00-overview.md")
}
