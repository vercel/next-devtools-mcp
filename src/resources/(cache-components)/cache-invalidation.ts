import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-cache-invalidation",
  title: "Cache Components Cache Invalidation",
  description: "updateTag(), revalidateTag() patterns and cache invalidation strategies",
}

export default function handler() {
  return readResourceFile("(cache-components)/07-cache-invalidation.md")
}

