import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://request-apis",
  name: "cache-components-request-apis",
  title: "Cache Components Request APIs",
  description: "Async params, searchParams, cookies(), headers() patterns",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/06-request-apis.md")
}

