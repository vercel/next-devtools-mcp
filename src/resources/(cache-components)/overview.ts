import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-overview",
  title: "Cache Components Overview",
  description: "Critical errors AI agents make, quick reference for Cache Components",
}

export default function handler() {
  return readResourceFile("(cache-components)/00-overview.md")
}

