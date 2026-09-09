import { z } from "zod"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

// Older 16.x releases do not bundle docs. Check package contents before
// directing agents to local files; the major version alone is insufficient.
const BUNDLED_DOCS_MIN_MAJOR = 16

export const inputSchema = {
  topic: z
    .string()
    .optional()
    .describe(
      "Optional: what you're looking for (e.g. 'use cache', 'generateMetadata', 'middleware'). Used only to suggest where to look in the bundled docs."
    ),
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

type NextjsDocsArgs = {
  topic?: string
  project_path?: string
}

export const metadata = {
  name: "nextjs_docs",
  description: `Find the version-accurate Next.js documentation for THIS project.

This tool does NOT fetch documentation. Recent Next.js releases ship their full docs inside the installed package at \`node_modules/next/dist/docs/\` (markdown), kept in sync with the exact version you have installed. This tool tells you where those docs are and how to read them — so you read the docs that match this project, not a generic or outdated copy.

Call this before answering Next.js questions or writing Next.js code. Then read the relevant guide from the path it returns. If the installed release has no bundled docs, it provides an online fallback. If dependencies are missing, it asks you to install them.`,
}

// Extract the major version from an installed version ("16.3.0-canary.49") or a
// declared range ("^16.0.0", "~15.2"). Returns null when it can't be determined
// (e.g. "latest", "canary", a git/file specifier).
function parseMajor(versionish: string | null | undefined): number | null {
  if (!versionish) return null
  const match = versionish.match(/(\d+)\./)
  if (!match) {
    // Bare integer like "16"
    const bare = versionish.match(/^\D*(\d+)\D*$/)
    return bare ? parseInt(bare[1], 10) : null
  }
  return parseInt(match[1], 10)
}

// Follow the project's module resolution, including hoisted workspace installs.
function resolveNextPackagePath(projectPath: string): string | null {
  try {
    return createRequire(path.resolve(projectPath, "package.json")).resolve("next/package.json")
  } catch {
    return null
  }
}

function getDocsDirectory(projectPath: string): string {
  const packagePath = resolveNextPackagePath(projectPath)
  return path.join(
    packagePath ? path.dirname(packagePath) : path.resolve(projectPath, "node_modules", "next"),
    "dist",
    "docs"
  )
}

// Resolve the Next.js version for a project, preferring the actually-installed
// version (most accurate) over the declared dependency range.
function resolveNextVersion(projectPath: string): {
  version: string | null
  source: "installed" | "declared" | null
} {
  try {
    const installedPkg = resolveNextPackagePath(projectPath)
    if (installedPkg) {
      const { version } = JSON.parse(fs.readFileSync(installedPkg, "utf8"))
      if (typeof version === "string") return { version, source: "installed" }
    }
  } catch {
    // fall through to declared
  }

  try {
    const pkgPath = path.join(projectPath, "package.json")
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      const declared = pkg.dependencies?.next ?? pkg.devDependencies?.next
      if (typeof declared === "string") return { version: declared, source: "declared" }
    }
  } catch {
    // fall through to unknown
  }

  return { version: null, source: null }
}

export async function handler({ topic, project_path }: NextjsDocsArgs): Promise<string> {
  const projectPath = project_path || process.cwd()
  const { version, source } = resolveNextVersion(projectPath)
  const major = parseMajor(version)

  // Treat unknown declared versions like "latest"/"canary" as modern.
  const isModern =
    major !== null
      ? major >= BUNDLED_DOCS_MIN_MAJOR
      : /latest|canary|rc|beta/i.test(version ?? "")

  if (isModern) {
    const docsDir = getDocsDirectory(projectPath)
    const docsExist = fs.existsSync(docsDir)
    if (!docsExist) {
      const installed = source === "installed"
      return JSON.stringify({
        status: installed ? "use_online_docs" : "install_required",
        nextVersion: version,
        versionSource: source,
        docsAvailable: false,
        docsUrl: "https://nextjs.org/docs",
        instructions: installed
          ? [
              `The installed Next.js ${version} package has no bundled docs directory.`,
              "Use https://nextjs.org/docs as a fallback. Online docs may describe newer releases; verify APIs against the installed version and its release notes.",
            ]
          : [
              "Install this project's dependencies with its package manager, then call nextjs_docs again to locate the installed version's docs.",
              "Until then, refer to https://nextjs.org/docs and verify version-specific APIs.",
            ],
      })
    }
    return JSON.stringify({
      status: "use_bundled_docs",
      nextVersion: version,
      versionSource: source,
      docsPath: docsDir,
      docsAvailable: docsExist,
      instructions: [
        "Next.js ships its full documentation with the installed package, matching your exact version.",
        `Read the relevant guide directly from \`${docsDir}\` (markdown files mirroring the nextjs.org/docs structure).`,
        topic
          ? `For "${topic}", search the markdown files under \`${docsDir}\` for that API or topic.`
          : "Browse the directory or grep it for the API/topic you need.",
        "Do not rely on training-data knowledge of Next.js APIs — this version may differ. Prefer the bundled docs.",
      ],
    })
  }

  // Older Next.js (or no Next.js found): point to the upgrade path.
  return JSON.stringify({
    status: "upgrade_required",
    nextVersion: version,
    versionSource: source,
    message:
      version
        ? `This project is on Next.js ${version}. Recent Next.js releases can bundle version-accurate documentation at node_modules/next/dist/docs/.`
        : `No installed Next.js was detected in ${projectPath}. Recent Next.js releases can bundle version-accurate documentation at node_modules/next/dist/docs/.`,
    instructions: [
      `Upgrade to the latest Next.js by running: npx @next/codemod@latest upgrade latest`,
      "After installing the upgraded version, call nextjs_docs again to check for bundled documentation.",
      "Until then, refer to https://nextjs.org/docs and avoid guessing version-specific APIs.",
    ],
  })
}
