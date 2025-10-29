import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "cache-components-request-apis",
  title: "Cache Components Request APIs",
  description: "Async params, searchParams, cookies(), headers() patterns",
}

export default function handler() {
  return readResourceFile("(cache-components)/06-request-apis.md")
}

