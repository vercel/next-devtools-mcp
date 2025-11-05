import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://cache-invalidation",
  name: "cache-components-cache-invalidation",
  title: "Cache Components Cache Invalidation",
  description: "updateTag(), revalidateTag() patterns and cache invalidation strategies",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/07-cache-invalidation.md")
}

