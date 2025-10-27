import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-runtime-prefetching",
  title: "Runtime Prefetching",
  description: "unstable_prefetch configuration and runtime prefetch patterns",
}

export default function handler() {
  return readResourceFile("04-runtime-prefetching.md")
}
