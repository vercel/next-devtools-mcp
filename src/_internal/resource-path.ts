import { join, dirname } from "node:path"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

const DIST_RESOURCES_DIR = "resources"

function findProjectRoot(startDir: string): string {
  let current = startDir

  while (current !== dirname(current)) {
    const distPath = join(current, "dist")
    const packageJsonPath = join(current, "package.json")

    if (existsSync(distPath) || existsSync(packageJsonPath)) {
      return current
    }

    current = dirname(current)
  }

  return startDir
}

function getResourcesRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url))

  if (currentDir.includes("/dist/")) {
    const distIndex = currentDir.lastIndexOf("/dist/")
    const projectRoot = currentDir.substring(0, distIndex)
    return join(projectRoot, "dist", DIST_RESOURCES_DIR)
  }

  const projectRoot = findProjectRoot(currentDir)
  return join(projectRoot, "dist", DIST_RESOURCES_DIR)
}

export function resolveResourcePath(filename: string): string {
  const resourcesRoot = getResourcesRoot()
  return join(resourcesRoot, filename)
}

export function readResourceFile(filename: string): string {
  const filePath = resolveResourcePath(filename)
  return readFileSync(filePath, "utf-8")
}
