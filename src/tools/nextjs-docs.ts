import { z } from "zod"
import fs from "node:fs"
import path from "node:path"

// Next.js started bundling its full documentation inside the npm package
// (node_modules/next/dist/docs/**/*.md) and generating an AGENTS.md that points
// there in v16.0.0. At or above this version, agents should read those local,
// version-accurate docs directly instead of fetching anything over MCP.
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

This tool does NOT fetch documentation. Next.js 16+ ships its full docs inside the installed package at \`node_modules/next/dist/docs/\` (markdown), kept in sync with the exact version you have installed. This tool tells you where those docs are and how to read them — so you read the docs that match this project, not a generic or outdated copy.

Call this before answering Next.js questions or writing Next.js code. Then read the relevant guide from the path it returns. If the project is on an older Next.js, it will tell you how to upgrade.`,
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

// Resolve the Next.js version for a project, preferring the actually-installed
// version (most accurate) over the declared dependency range.
function resolveNextVersion(projectPath: string): {
  version: string | null
  source: "installed" | "declared" | null
} {
  try {
    const installedPkg = path.join(
      projectPath,
      "node_modules",
      "next",
      "package.json"
    )
    if (fs.existsSync(installedPkg)) {
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
    const docsDir = path.join(projectPath, "node_modules", "next", "dist", "docs")
    const docsExist = fs.existsSync(docsDir)
    return JSON.stringify({
      status: "use_bundled_docs",
      nextVersion: version,
      versionSource: source,
      docsPath: "node_modules/next/dist/docs/",
      docsAvailable: docsExist,
      instructions: [
        "Next.js ships its full documentation with the installed package, matching your exact version.",
        `Read the relevant guide directly from \`${docsDir}\` (markdown files mirroring the nextjs.org/docs structure).`,
        topic
          ? `For "${topic}", search those files, e.g.: grep -ril "${topic.replace(/"/g, "")}" node_modules/next/dist/docs`
          : "Browse the directory or grep it for the API/topic you need.",
        "Do not rely on training-data knowledge of Next.js APIs — this version may differ. Prefer the bundled docs.",
        ...(docsExist
          ? []
          : [
              "Note: the docs directory was not found. Make sure dependencies are installed (the docs ship inside the `next` package).",
            ]),
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
        ? `This project is on Next.js ${version}. Version-accurate documentation is bundled with Next.js ${BUNDLED_DOCS_MIN_MAJOR}+ (at node_modules/next/dist/docs/) and surfaced to agents via AGENTS.md.`
        : `No installed Next.js was detected in ${projectPath}. Next.js ${BUNDLED_DOCS_MIN_MAJOR}+ bundles version-accurate documentation at node_modules/next/dist/docs/.`,
    instructions: [
      `Upgrade to the latest Next.js by running: npx @next/codemod@latest upgrade latest`,
      "After upgrading, this project will ship version-accurate docs locally and `next dev` will generate/update an AGENTS.md pointing agents to them.",
      "Until then, refer to https://nextjs.org/docs and avoid guessing version-specific APIs.",
    ],
  })
}
