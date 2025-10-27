import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-cache-invalidation",
  title: "Cache Invalidation",
  description: "updateTag(), revalidateTag(), and invalidation strategies",
}

export default function handler() {
  return readResourceFile("07-cache-invalidation.md")
}
