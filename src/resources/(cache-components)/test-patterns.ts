import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-test-patterns",
  title: "Cache Components Test Patterns",
  description: "Real test-driven patterns from 125+ fixtures",
}

export default function handler() {
  return readResourceFile("(cache-components)/11-test-patterns.md")
}

