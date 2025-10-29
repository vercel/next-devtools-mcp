import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-reference",
  title: "Cache Components Complete Reference",
  description: "Mental models, API reference, and checklists for Cache Components",
}

export default function handler() {
  return readResourceFile("(cache-components)/12-reference.md")
}

