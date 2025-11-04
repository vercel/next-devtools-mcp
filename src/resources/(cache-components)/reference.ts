import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://reference",
  name: "cache-components-reference",
  title: "Cache Components Complete Reference",
  description: "Mental models, API reference, and checklists for Cache Components",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/12-reference.md")
}

