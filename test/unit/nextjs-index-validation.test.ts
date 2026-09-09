import { beforeEach, describe, expect, it, vi } from "vitest"
import { handler } from "../../src/tools/nextjs_index.js"
import {
  getAllAvailableServers,
  listNextJsTools,
} from "../../src/_internal/nextjs-runtime-manager.js"

vi.mock("../../src/_internal/nextjs-runtime-manager.js", () => ({
  getAllAvailableServers: vi.fn(),
  listNextJsTools: vi.fn(),
  detectProtocol: vi.fn().mockResolvedValue("http"),
  MCP_HOST: "localhost",
}))

describe("nextjs_index candidate validation", () => {
  beforeEach(() => vi.clearAllMocks())
  const candidates = [
    { port: 3000, pid: 0, command: "HTTP catch-all" },
    { port: 3001, pid: 0, command: "Next.js" },
  ]
  const tools = [{ name: "get_errors", inputSchema: { type: "object" } }]

  it("excludes a candidate whose MCP tool listing fails", async () => {
    vi.mocked(getAllAvailableServers).mockResolvedValue(candidates)
    vi.mocked(listNextJsTools).mockImplementation(async (port) => (port === 3001 ? tools : []))
    const result = JSON.parse(await handler())
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(result.servers.map((server: { port: number }) => server.port)).toEqual([3001])
    expect(result.message).toBe("Found 1 Next.js server with MCP enabled")
  })

  it("returns no-servers guidance when every candidate fails validation", async () => {
    vi.mocked(getAllAvailableServers).mockResolvedValue(candidates)
    vi.mocked(listNextJsTools).mockResolvedValue([])
    const result = JSON.parse(await handler())
    expect(result.success).toBe(false)
    expect(result.servers).toEqual([])
    expect(result.error).toContain("No running Next.js dev servers")
  })

  it("still rejects an invalid explicit port candidate", async () => {
    vi.mocked(listNextJsTools).mockResolvedValue([])
    expect(JSON.parse(await handler({ port: 3000 })).success).toBe(false)
  })
})
