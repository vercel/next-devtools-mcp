import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-error-patterns",
  title: "Error Patterns",
  description: "Common errors and solutions",
}

export default function handler() {
  return readResourceFile("10-error-patterns.md")
}
