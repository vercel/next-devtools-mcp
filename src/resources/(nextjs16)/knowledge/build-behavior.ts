import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-build-behavior",
  title: "Build Behavior",
  description: "Prerendering, resume data cache, and build-time behavior",
}

export default function handler() {
  return readResourceFile("09-build-behavior.md")
}
