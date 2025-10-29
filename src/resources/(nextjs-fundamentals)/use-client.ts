import { type ResourceMetadata } from "xmcp"
import { readResourceFile } from "../../_internal/resource-path"

export const metadata: ResourceMetadata = {
  name: "nextjs-fundamentals-use-client",
  title: "Understanding 'use client' Directive",
  description: "Learn when and why to use 'use client' in Server Components",
}

export default function handler() {
  return readResourceFile("(nextjs-fundamentals)/01-use-client.md")
}
