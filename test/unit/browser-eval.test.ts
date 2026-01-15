import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("../../src/_internal/mcp-client.js", () => ({
  connectToMCPServer: vi.fn(),
  callServerTool: vi.fn(),
  listServerTools: vi.fn(),
}))

vi.mock("child_process", () => ({
  exec: vi.fn((_cmd, callback) => {
    callback(null, { stdout: "@playwright/mcp@1.0.0" })
  }),
}))

import { connectToMCPServer, callServerTool, listServerTools } from "../../src/_internal/mcp-client.js"
import { startBrowserEvalMCP, stopBrowserEvalMCP } from "../../src/_internal/browser-eval-manager.js"
import { handler } from "../../src/tools/browser-eval.js"

describe("browser-eval", () => {
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

  describe("server flags", () => {
    it("should pass required flags to playwright-mcp", async () => {
      await startBrowserEvalMCP()

      const args = vi.mocked(connectToMCPServer).mock.calls[0][1] as string[]
      expect(args).toContain("@playwright/mcp@latest")
      expect(args).toEqual(expect.arrayContaining(["--image-responses", "omit"]))
      expect(args).toEqual(expect.arrayContaining(["--caps", "pdf,vision"]))
    })

    it("should pass browser and headless options", async () => {
      await startBrowserEvalMCP({ browser: "firefox", headless: true })

      const args = vi.mocked(connectToMCPServer).mock.calls[0][1] as string[]
      expect(args).toEqual(expect.arrayContaining(["--browser", "firefox"]))
      expect(args).toContain("--headless")
    })
  })

  describe("action routing", () => {
    beforeEach(async () => {
      await startBrowserEvalMCP()
      vi.mocked(callServerTool).mockResolvedValue({ content: [] })
    })

    // [action, expectedToolName, inputArgs, expectedArgs]
    const cases: Array<[string, string, Record<string, unknown>?, Record<string, unknown>?]> = [
      ["navigate", "browser_navigate", { url: "https://example.com" }, { url: "https://example.com" }],
      ["go_back", "browser_navigate_back"],
      ["snapshot", "browser_snapshot"],
      ["wait", "browser_wait_for", { time: 1000 }, { time: 1000 }],
      ["click", "browser_click", { element: ".btn", doubleClick: true }, { element: ".btn", doubleClick: true }],
      ["hover", "browser_hover", { ref: "@1" }, { ref: "@1" }],
      ["press_key", "browser_press_key", { key: "Control+a" }, { key: "Control+a" }],
      ["type", "browser_type", { text: "hello", element: "#in" }, { text: "hello", element: "#in" }],
      ["evaluate", "browser_evaluate", { script: "1+1" }],
      ["screenshot", "browser_take_screenshot", { fullPage: true }, { fullPage: true }],
      ["save_pdf", "browser_pdf_save"],
      ["console_messages", "browser_console_messages"],
      ["handle_dialog", "browser_handle_dialog", { dialogAction: "accept", promptText: "x" }, { accept: true, promptText: "x" }],
      ["drag", "browser_drag", { startElement: ".a", endElement: ".b" }],
      ["list_tabs", "browser_tabs", undefined, { action: "list" }],
      ["switch_tab", "browser_tabs", { tabId: "1" }, { action: "select", index: 1 }],
      ["close_tab", "browser_tabs", { tabId: "2" }, { action: "close", index: 2 }],
      // Coordinate-based actions (requires vision capability + element description)
      ["click_xy", "browser_mouse_click_xy", { element: "Submit button", x: 100, y: 200 }, { element: "Submit button", x: 100, y: 200 }],
      ["move_xy", "browser_mouse_move_xy", { element: "Nav menu", x: 50, y: 75 }, { element: "Nav menu", x: 50, y: 75 }],
      ["drag_xy", "browser_mouse_drag_xy", { element: "Slider", startX: 0, startY: 0, endX: 100, endY: 100 }, { element: "Slider", startX: 0, startY: 0, endX: 100, endY: 100 }],
    ]

    it.each(cases)("%s → %s", async (action, expectedTool, inputArgs = {}, expectedArgs) => {
      await handler({ action, ...inputArgs } as Parameters<typeof handler>[0])
      if (expectedArgs) {
        expect(callServerTool).toHaveBeenCalledWith(expect.anything(), expectedTool, expect.objectContaining(expectedArgs))
      } else {
        expect(callServerTool).toHaveBeenCalledWith(expect.anything(), expectedTool, expect.anything())
      }
    })
  })

  describe("validation", () => {
    beforeEach(async () => {
      await startBrowserEvalMCP()
    })

    const cases: Array<[string, string]> = [
      ["navigate", "URL is required"],
      ["wait", "time (in milliseconds) is required"],
      ["click", "element or ref is required"],
      ["hover", "element or ref is required"],
      ["type", "Text is required"],
      ["evaluate", "Script is required"],
      ["press_key", "key is required"],
      ["handle_dialog", "dialogAction"],
      ["switch_tab", "tabId is required"],
      ["close_tab", "tabId is required"],
      // Coordinate-based actions (require element description first)
      ["click_xy", "element description is required"],
      ["move_xy", "element description is required"],
      ["drag_xy", "element description is required"],
    ]

    it.each(cases)("%s requires parameters", async (action, expectedError) => {
      const result = JSON.parse(await handler({ action } as Parameters<typeof handler>[0]))
      expect(result.success).toBe(false)
      expect(result.error).toContain(expectedError)
    })

    it("errors when browser not started", async () => {
      await stopBrowserEvalMCP()
      const result = JSON.parse(await handler({ action: "snapshot" }))
      expect(result.success).toBe(false)
      expect(result.error).toContain("Browser automation not started")
    })
  })

  describe("edge cases", () => {
    beforeEach(async () => {
      await startBrowserEvalMCP()
      vi.mocked(callServerTool).mockResolvedValue({ content: [] })
    })

    it("hover accepts both element and ref", async () => {
      await handler({ action: "hover", element: ".btn", ref: "@1" })
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_hover",
        expect.objectContaining({ element: ".btn", ref: "@1" })
      )
    })

    it("click accepts both element and ref", async () => {
      await handler({ action: "click", element: ".btn", ref: "@1" })
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_click",
        expect.objectContaining({ element: ".btn", ref: "@1" })
      )
    })

    it("handle_dialog passes promptText even with dismiss", async () => {
      await handler({ action: "handle_dialog", dialogAction: "dismiss", promptText: "ignored" })
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_handle_dialog",
        expect.objectContaining({ accept: false, promptText: "ignored" })
      )
    })

    it("new_tab creates tab without navigation", async () => {
      await handler({ action: "new_tab" })
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_tabs",
        { action: "new" }
      )
      expect(callServerTool).toHaveBeenCalledTimes(1)
    })

    it("new_tab creates tab and navigates when URL provided", async () => {
      await handler({ action: "new_tab", url: "https://example.com" })
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_tabs",
        { action: "new" }
      )
      expect(callServerTool).toHaveBeenCalledWith(
        expect.anything(),
        "browser_navigate",
        { url: "https://example.com" }
      )
      expect(callServerTool).toHaveBeenCalledTimes(2)
    })
  })

  describe("lifecycle", () => {
    it("start and close", async () => {
      const start = JSON.parse(await handler({ action: "start" }))
      expect(start.success).toBe(true)

      const close = JSON.parse(await handler({ action: "close" }))
      expect(close.success).toBe(true)
    })

    it("list_tools", async () => {
      await handler({ action: "start" })
      vi.mocked(listServerTools).mockResolvedValue(["browser_navigate", "browser_click"])

      const result = JSON.parse(await handler({ action: "list_tools" }))
      expect(result.success).toBe(true)
      expect(result.tools).toHaveLength(2)
    })
  })

  describe("response format", () => {
    beforeEach(async () => {
      await startBrowserEvalMCP()
    })

    it("returns success with result", async () => {
      vi.mocked(callServerTool).mockResolvedValue({ content: [{ type: "text", text: "ok" }] })

      const result = JSON.parse(await handler({ action: "go_back" }))
      expect(result).toMatchObject({ success: true, action: "go_back" })
      expect(result.result.content).toEqual([{ type: "text", text: "ok" }])
    })

    it("returns error on failure", async () => {
      vi.mocked(callServerTool).mockRejectedValue(new Error("Connection lost"))

      const result = JSON.parse(await handler({ action: "go_back" }))
      expect(result).toMatchObject({ success: false, action: "go_back", error: "Connection lost" })
    })
  })
})
