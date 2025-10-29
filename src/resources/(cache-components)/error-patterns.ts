import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-error-patterns",
  title: "Cache Components Error Patterns",
  description: "Common errors and solutions for Cache Components",
}

export default function handler() {
  return readResourceFile("(cache-components)/10-error-patterns.md")
}

