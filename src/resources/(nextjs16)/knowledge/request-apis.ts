import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs16-knowledge-request-apis",
  title: "Request APIs",
  description: "Async params, cookies(), headers(), and connection() API patterns",
}

export default function handler() {
  return readResourceFile("06-request-apis.md")
}
