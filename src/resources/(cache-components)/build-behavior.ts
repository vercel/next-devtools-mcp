import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-build-behavior",
  title: "Cache Components Build Behavior",
  description: "What gets prerendered, static shells, and build-time behavior",
}

export default function handler() {
  return readResourceFile("(cache-components)/09-build-behavior.md")
}

