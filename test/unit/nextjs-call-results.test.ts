import { beforeEach, describe, expect, it, vi } from "vitest"
import { handler } from "../../src/tools/nextjs_call.js"
import { callNextJsTool } from "../../src/_internal/nextjs-runtime-manager.js"

vi.mock("../../src/_internal/nextjs-runtime-manager.js", () => ({ callNextJsTool: vi.fn() }))

describe("nextjs_call result status", () => {
  beforeEach(() => vi.resetAllMocks())

  it("preserves a downstream MCP tool error and its content", async () => {
    const downstream = { isError: true, content: [{ type: "text", text: "Missing route" }] }
    vi.mocked(callNextJsTool).mockResolvedValue(downstream)
    const result = await handler({ port: 3000, toolName: "compile_route" })
    expect(result.isError).toBe(true)
    expect(JSON.parse(result.content[0].text as string)).toEqual({
      success: false,
      port: 3000,
      toolName: "compile_route",
      result: downstream,
    })
  })

  it("keeps successful runtime results successful", async () => {
    const downstream = { content: [{ type: "text", text: "Healthy" }] }
    vi.mocked(callNextJsTool).mockResolvedValue(downstream)
    const result = await handler({ port: "3000", toolName: "get_errors" })
    expect(result.isError).not.toBe(true)
    expect(JSON.parse(result.content[0].text as string)).toEqual({
      success: true,
      port: 3000,
      toolName: "get_errors",
      result: downstream,
    })
  })

  it("marks upstream request failures as tool errors", async () => {
    vi.mocked(callNextJsTool).mockRejectedValue(new Error("Connection refused"))
    const result = await handler({ port: 3000, toolName: "get_errors" })
    expect(result.isError).toBe(true)
    expect(JSON.parse(result.content[0].text as string).error).toBe("Connection refused")
  })
})
