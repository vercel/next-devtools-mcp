import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-core-mechanics",
  title: "Core Mechanics",
  description: "Fundamental paradigm shift and how cacheComponents works",
}

export default function handler() {
  return readResourceFile("01-core-mechanics.md")
}
