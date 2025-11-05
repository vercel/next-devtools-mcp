import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://test-patterns",
  name: "cache-components-test-patterns",
  title: "Cache Components Test Patterns",
  description: "Real test-driven patterns from 125+ fixtures",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/11-test-patterns.md")
}

