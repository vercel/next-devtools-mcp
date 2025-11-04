import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://error-patterns",
  name: "cache-components-error-patterns",
  title: "Cache Components Error Patterns",
  description: "Common errors and solutions for Cache Components",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/10-error-patterns.md")
}

