import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Control whether agent-browser appears installed by mocking child_process.execSync.
const execSyncMock = vi.fn()
vi.mock("child_process", () => ({
  execSync: (...args: unknown[]) => execSyncMock(...args),
}))

import { handler, metadata } from "../../src/tools/browser-eval.js"

describe("browser_eval gateway", () => {
  beforeEach(() => {
    execSyncMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("keeps the browser_eval name", () => {
    expect(metadata.name).toBe("browser_eval")
  })

  it("points at the agent-browser CLI when installed", async () => {
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd.includes("command -v") || cmd.includes("where ")) return "/usr/local/bin/agent-browser\n"
      if (cmd.includes("--version")) return "0.27.3\n"
      return ""
    })

    const result = JSON.parse(await handler({}))
    expect(result.status).toBe("use_agent_browser")
    expect(result.version).toBe("0.27.3")
    expect(JSON.stringify(result.instructions)).toContain("agent-browser skills get core --full")
  })

  it("returns install guidance when not installed", async () => {
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd.includes("command -v") || cmd.includes("where ")) {
        throw new Error("not found")
      }
      return ""
    })

    const result = JSON.parse(await handler({}))
    expect(result.status).toBe("install_required")
    expect(JSON.stringify(result.instructions)).toContain("npm install -g agent-browser")
    expect(JSON.stringify(result.instructions)).toContain("agent-browser install")
  })

  it("incorporates the task hint when installed", async () => {
    execSyncMock.mockImplementation((cmd: string) => {
      if (cmd.includes("command -v") || cmd.includes("where ")) return "/usr/local/bin/agent-browser\n"
      if (cmd.includes("--version")) return "0.27.3\n"
      return ""
    })

    const result = JSON.parse(
      await handler({ task: "open localhost:3000 and check console errors" })
    )
    expect(JSON.stringify(result.instructions)).toContain("localhost:3000")
  })
})
