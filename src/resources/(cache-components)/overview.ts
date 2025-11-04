import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://overview",
  name: "cache-components-overview",
  title: "Cache Components Overview",
  description: "Critical errors AI agents make, quick reference for Cache Components",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/00-overview.md")
}

