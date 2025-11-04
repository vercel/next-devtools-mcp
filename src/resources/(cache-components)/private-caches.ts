import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://private-caches",
  name: "cache-components-private-caches",
  title: "Cache Components Private Caches",
  description: "Private cache mechanics using 'use cache: private'",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/03-private-caches.md")
}

