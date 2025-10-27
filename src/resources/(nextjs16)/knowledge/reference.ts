import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-reference",
  title: "Reference Materials",
  description: "API quick reference and comprehensive checklists",
}

export default function handler() {
  return readResourceFile("12-reference.md")
}
