import { readdirSync, existsSync } from "node:fs"
import { resolveResourcePath, readResourceFile } from "./resource-path.js"

export function loadKnowledgeResources(): Record<string, string> {
  const resources: Record<string, string> = {}
  const resourcesDir = resolveResourcePath("")

  if (!existsSync(resourcesDir)) {
    console.warn(`Resources directory not found: ${resourcesDir}`)
    return resources
  }

  const files = readdirSync(resourcesDir)
    .filter((file) => file.endsWith(".md") && /^\d+-/.test(file))
    .sort()

  for (const file of files) {
    const content = readResourceFile(file)
    const key = file.replace(/^\d+-/, "").replace(".md", "")
    resources[key] = content
  }

  return resources
}

export function loadNumberedMarkdownFilesWithNames(): Array<{ filename: string; content: string }> {
  const results: Array<{ filename: string; content: string }> = []
  const resourcesDir = resolveResourcePath("")

  if (!existsSync(resourcesDir)) {
    console.warn(`Resources directory not found: ${resourcesDir}`)
    return results
  }

  const files = readdirSync(resourcesDir)
    .filter((file) => file.endsWith(".md") && /^\d+-/.test(file))
    .sort()

  for (const file of files) {
    const content = readResourceFile(file)
    results.push({ filename: file, content })
  }

  return results
}
