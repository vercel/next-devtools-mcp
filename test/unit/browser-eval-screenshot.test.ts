import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock the mcp-client module before importing browser-eval-manager
vi.mock("../../src/_internal/mcp-client.js", () => ({
  connectToMCPServer: vi.fn(),
  callServerTool: vi.fn(),
  listServerTools: vi.fn(),
}))

// Mock the exec function to skip installation check
vi.mock("child_process", () => ({
  exec: vi.fn((cmd, callback) => {
    callback(null, { stdout: "@playwright/mcp@1.0.0" })
  }),
}))

import { connectToMCPServer, callServerTool } from "../../src/_internal/mcp-client.js"
import {
  startBrowserEvalMCP,
  stopBrowserEvalMCP,
} from "../../src/_internal/browser-eval-manager.js"
import { handler } from "../../src/tools/browser-eval.js"

describe("browser-eval playwright-mcp screenshot tool", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(connectToMCPServer).mockResolvedValue({
      client: { close: vi.fn() },
      transport: { close: vi.fn() },
    } as never)
  })

  afterEach(async () => {
    await stopBrowserEvalMCP()
  })

  it("should pass --image-responses omit flag to playwright-mcp", async () => {
    await startBrowserEvalMCP()

    expect(connectToMCPServer).toHaveBeenCalledWith(
      "npx",
      expect.arrayContaining(["--image-responses", "omit"]),
      expect.any(Object)
    )
  })

  it("should return screenshot file path without base64 image data", async () => {
    await startBrowserEvalMCP()

    const screenshotPath = "/var/folders/tmp/screenshot-1234.png"
    vi.mocked(callServerTool).mockResolvedValue({
      content: [{ type: "text", text: `Screenshot saved to ${screenshotPath}` }],
    })

    const result = await handler({ action: "screenshot" })
    const parsed = JSON.parse(result)

    expect(parsed.success).toBe(true)
    expect(parsed.action).toBe("screenshot")

    // Verify response contains file path
    const textContent = parsed.result.content.find(
      (block: { type: string }) => block.type === "text"
    )
    expect(textContent.text).toContain(screenshotPath)

    // Verify no base64 image data in response
    const imageContent = parsed.result.content.find(
      (block: { type: string }) => block.type === "image"
    )
    expect(imageContent).toBeUndefined()
  })
})
