import { readResourceFile } from "../../_internal/resource-path.js"

export const metadata = {
  uri: "nextjs-fundamentals://use-client",
  name: "nextjs-fundamentals-use-client",
  title: "Understanding 'use client' Directive",
  description: "Learn when and why to use 'use client' in Server Components",
  mimeType: "text/markdown",
}

export function handler() {
  return readResourceFile("(nextjs-fundamentals)/01-use-client.md")
}
