import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-test-patterns",
  title: "Real Test-Driven Patterns",
  description: "E2E pattern library from 125+ test fixtures",
}

export default function handler() {
  return readResourceFile("11-test-patterns.md")
}
