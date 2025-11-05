import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://core-mechanics",
  name: "cache-components-core-mechanics",
  title: "Cache Components Core Mechanics",
  description: "Fundamental paradigm shift and cacheComponents behavior",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/01-core-mechanics.md")
}

