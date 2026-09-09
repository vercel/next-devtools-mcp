import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { handler } from "../../src/tools/nextjs-docs.js"

let tmpDir: string

function makeProject(opts: {
  declared?: string
  installed?: string
  withDocs?: boolean
}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nextjs-docs-gateway-"))
  if (opts.declared) {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ dependencies: { next: opts.declared } })
    )
  }
  if (opts.installed) {
    const nextPkgDir = path.join(dir, "node_modules", "next")
    fs.mkdirSync(nextPkgDir, { recursive: true })
    fs.writeFileSync(
      path.join(nextPkgDir, "package.json"),
      JSON.stringify({ name: "next", version: opts.installed })
    )
    if (opts.withDocs) {
      const docsDir = path.join(nextPkgDir, "dist", "docs")
      fs.mkdirSync(docsDir, { recursive: true })
      fs.writeFileSync(path.join(docsDir, "index.md"), "# docs")
    }
  }
  return dir
}

describe("nextjs_docs gateway", () => {
  beforeEach(() => {
    tmpDir = ""
  })

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("points at bundled docs for installed Next.js 16+", async () => {
    tmpDir = makeProject({ installed: "16.3.0", withDocs: true })
    const result = JSON.parse(await handler({ project_path: tmpDir }))

    expect(result.status).toBe("use_bundled_docs")
    expect(result.nextVersion).toBe("16.3.0")
    expect(result.versionSource).toBe("installed")
    expect(result.docsAvailable).toBe(true)
    expect(result.docsPath).toBe(fs.realpathSync(path.join(tmpDir, "node_modules/next/dist/docs")))
  })

  it("treats a canary install as modern", async () => {
    tmpDir = makeProject({ installed: "16.0.0-canary.49", withDocs: true })
    const result = JSON.parse(await handler({ project_path: tmpDir }))
    expect(result.status).toBe("use_bundled_docs")
  })

  it("prefers the installed version over the declared range", async () => {
    // Declares ^15 but actually has 16 installed -> should use installed (modern).
    tmpDir = makeProject({ declared: "^15.0.0", installed: "16.1.0", withDocs: true })
    const result = JSON.parse(await handler({ project_path: tmpDir }))
    expect(result.status).toBe("use_bundled_docs")
    expect(result.versionSource).toBe("installed")
  })

  it("recommends the codemod for Next.js below 16", async () => {
    tmpDir = makeProject({ declared: "15.2.0", installed: "15.2.0" })
    const result = JSON.parse(await handler({ project_path: tmpDir }))

    expect(result.status).toBe("upgrade_required")
    expect(result.nextVersion).toBe("15.2.0")
    expect(JSON.stringify(result.instructions)).toContain(
      "npx @next/codemod@latest upgrade latest"
    )
  })

  it("recommends upgrade when no Next.js is detected", async () => {
    tmpDir = makeProject({})
    const result = JSON.parse(await handler({ project_path: tmpDir }))
    expect(result.status).toBe("upgrade_required")
    expect(result.nextVersion).toBeNull()
  })

  it("offers a docs fallback for an installed release without bundled docs", async () => {
    tmpDir = makeProject({ installed: "16.0.7", withDocs: false })
    const result = JSON.parse(await handler({ project_path: tmpDir }))
    expect(result.status).toBe("use_online_docs")
    expect(result.docsAvailable).toBe(false)
    expect(result.nextVersion).toBe("16.0.7")
    expect(result.versionSource).toBe("installed")
    expect(result.docsUrl).toBe("https://nextjs.org/docs")
    expect(JSON.stringify(result.instructions)).not.toContain(
      "Make sure dependencies are installed"
    )
    expect(JSON.stringify(result.instructions)).toContain("16.0.7")
  })

  it("includes a search hint when a topic is provided", async () => {
    tmpDir = makeProject({ installed: "16.2.0", withDocs: true })
    const result = JSON.parse(await handler({ project_path: tmpDir, topic: "use cache" }))
    expect(JSON.stringify(result.instructions)).toContain("use cache")
  })
})

// Missing dependencies and old package contents require different recovery steps.
it("asks for installation only when a modern dependency is not installed", async () => {
  const dir = makeProject({ declared: "^16.0.0" })
  try {
    const result = JSON.parse(await handler({ project_path: dir }))
    expect(result.status).toBe("install_required")
    expect(result.docsAvailable).toBe(false)
    expect(result.versionSource).toBe("declared")
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

it("resolves installed versions and docs from a hoisted dependency", async () => {
  const dir = makeProject({ installed: "16.3.0", withDocs: true })
  const child = path.join(dir, "packages", "web")
  fs.mkdirSync(child, { recursive: true })
  fs.writeFileSync(
    path.join(child, "package.json"),
    JSON.stringify({ dependencies: { next: "^16.0.0" } })
  )
  try {
    const result = JSON.parse(await handler({ project_path: child, topic: "use cache" }))
    expect(result.versionSource).toBe("installed")
    expect(result.nextVersion).toBe("16.3.0")
    expect(result.docsAvailable).toBe(true)
    expect(result.docsPath).toBe(fs.realpathSync(path.join(dir, "node_modules/next/dist/docs")))
    expect(result.instructions[1]).toContain(result.docsPath)
    expect(result.instructions[2]).toContain(result.docsPath)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

it("prefers a child-local installation over an ancestor installation", async () => {
  const dir = makeProject({ installed: "16.3.0", withDocs: true })
  const child = path.join(dir, "packages", "web")
  const pkg = path.join(child, "node_modules", "next")
  fs.mkdirSync(path.join(pkg, "dist", "docs"), { recursive: true })
  fs.writeFileSync(
    path.join(pkg, "package.json"),
    JSON.stringify({ name: "next", version: "16.2.0" })
  )
  try {
    const result = JSON.parse(await handler({ project_path: child }))
    expect(result.nextVersion).toBe("16.2.0")
    expect(result.docsPath).toBe(fs.realpathSync(path.join(pkg, "dist", "docs")))
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
