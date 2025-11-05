import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "cache-components://build-behavior",
  name: "cache-components-build-behavior",
  title: "Cache Components Build Behavior",
  description: "What gets prerendered, static shells, and build-time behavior",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(cache-components)/09-build-behavior.md")
}

