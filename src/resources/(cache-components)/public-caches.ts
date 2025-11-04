import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://public-caches",
  name: "cache-components-public-caches",
  title: "Cache Components Public Caches",
  description: "Public cache mechanics using 'use cache'",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/02-public-caches.md")
}

