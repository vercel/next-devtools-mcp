import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://route-handlers",
  name: "cache-components-route-handlers",
  title: "Route Handlers with Cache Components",
  description: "Using 'use cache' directive in Route Handlers (API Routes) - must extract to helper function",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/13-route-handlers.md")
}

