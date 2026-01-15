import { z } from "zod"
import {
  startBrowserEvalMCP,
  stopBrowserEvalMCP,
  getBrowserEvalConnection,
} from "../_internal/browser-eval-manager.js"
import { callServerTool, listServerTools } from "../_internal/mcp-client.js"

export const inputSchema = {
  action: z
    .enum([
      "start",
      "navigate",
      "go_back",
      "snapshot",
      "wait",
      "click",
      "click_xy",
      "hover",
      "move_xy",
      "drag_xy",
      "press_key",
      "type",
      "fill_form",
      "evaluate",
      "screenshot",
      "save_pdf",
      "console_messages",
      "handle_dialog",
      "close",
      "drag",
      "upload_file",
      "new_tab",
      "list_tabs",
      "switch_tab",
      "close_tab",
      "list_tools",
    ])
    .describe("The action to perform using browser automation"),

  browser: z
    .enum(["chrome", "firefox", "webkit", "msedge"])
    .optional()
    .describe("Browser to use (default: chrome). Only used with 'start' action."),
  headless: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .describe("Run browser in headless mode. Defaults to true (headless). Set to false only if you need to visually observe the browser. Only used with 'start' action."),

  url: z.string().optional().describe("URL to navigate to (required for 'navigate' action)"),

  element: z.string().optional().describe("Element to interact with (CSS selector or text)"),
  ref: z.string().optional().describe("Reference to element from accessibility snapshot"),
  doubleClick: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .describe("Perform double click instead of single click"),
  button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button to use"),
  modifiers: z
    .array(z.string())
    .optional()
    .describe("Keyboard modifiers (e.g., ['Control', 'Shift'])"),

  text: z.string().optional().describe("Text to type into element"),

  fields: z
    .array(
      z.object({
        selector: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .describe("Array of fields to fill in a form"),

  script: z.string().optional().describe("JavaScript code to evaluate in browser context"),

  fullPage: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .describe("Take full page screenshot"),

  errorsOnly: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional()
    .describe("Only return error messages from console"),

  startElement: z.string().optional().describe("Starting element for drag operation"),
  startRef: z.string().optional().describe("Starting element reference"),
  endElement: z.string().optional().describe("Ending element for drag operation"),
  endRef: z.string().optional().describe("Ending element reference"),

  files: z.array(z.string()).optional().describe("File paths to upload"),

  time: z
    .number()
    .optional()
    .describe("Time in milliseconds to wait (for 'wait' action with time-based waiting)"),

  tabId: z
    .string()
    .optional()
    .describe("Tab ID for tab management actions (required for 'switch_tab' and 'close_tab')"),

  key: z
    .string()
    .optional()
    .describe("Key to press (e.g., 'Enter', 'Tab', 'Escape', 'ArrowDown', 'Control+a'). For 'press_key' action."),

  dialogAction: z
    .enum(["accept", "dismiss"])
    .optional()
    .describe("Action to take on dialog: 'accept' (OK/Yes) or 'dismiss' (Cancel/No). For 'handle_dialog' action."),

  promptText: z
    .string()
    .optional()
    .describe("Text to enter in a prompt dialog before accepting. For 'handle_dialog' action with prompts."),

  // Coordinate-based actions (click_xy, move_xy, drag_xy)
  x: z.number().optional().describe("X coordinate for coordinate-based actions (click_xy, move_xy)"),
  y: z.number().optional().describe("Y coordinate for coordinate-based actions (click_xy, move_xy)"),
  startX: z.number().optional().describe("Starting X coordinate for drag_xy action"),
  startY: z.number().optional().describe("Starting Y coordinate for drag_xy action"),
  endX: z.number().optional().describe("Ending X coordinate for drag_xy action"),
  endY: z.number().optional().describe("Ending Y coordinate for drag_xy action"),

}

export const metadata = {
  name: "browser_eval",
  description: `Automate and test web applications using Playwright browser automation.
This tool connects to playwright-mcp server and provides access to all Playwright capabilities.

CRITICAL FOR PAGE VERIFICATION:
When verifying pages in Next.js projects (especially during upgrades or testing), you MUST use browser automation to load pages
in a real browser instead of curl or simple HTTP requests. This is because:
- Browser automation actually renders the page and executes JavaScript (curl only fetches HTML)
- Detects runtime errors, hydration issues, and client-side problems that curl cannot catch
- Verifies the full user experience, not just HTTP status codes
- Captures browser console errors and warnings via console_messages action

IMPORTANT FOR NEXT.JS PROJECTS:
If working with a Next.js application, PRIORITIZE using the 'nextjs_index' and 'nextjs_call' tools instead of browser console log forwarding.
Next.js has built-in MCP integration that provides superior error reporting, build diagnostics, and runtime information
directly from the Next.js dev server. Only use browser_eval's console_messages action as a fallback when these Next.js tools
are not available or when you specifically need to test client-side browser behavior that Next.js runtime cannot capture.

Available actions:
- start: Start browser automation in headless mode by default (automatically installs if needed). Verbose logging is always enabled.
- navigate: Navigate to a URL
- go_back: Navigate back in browser history (like clicking the back button)
- snapshot: Get accessibility snapshot of the page with element refs. Returns structured page content with refs (@ref1, @ref2...) that can be used in subsequent click/type actions. This is the RECOMMENDED workflow for AI agents: snapshot → identify element refs → use refs in actions → re-snapshot after changes.
- wait: Wait for a specified time in milliseconds. Use 'time' parameter. Essential for handling async operations and animations.
- click: Click on an element (use 'ref' parameter with snapshot refs for reliable element targeting)
- click_xy: Click at specific x,y coordinates (requires 'element' description for permission, e.g., "Submit button")
- hover: Hover over an element to trigger hover states, tooltips, or dropdown menus (use 'ref' from snapshot for reliable targeting)
- move_xy: Move mouse to specific x,y coordinates (requires 'element' description for permission)
- drag_xy: Drag from startX,startY to endX,endY coordinates (requires 'element' description for permission)
- press_key: Press a keyboard key (e.g., 'Enter', 'Tab', 'Escape', 'ArrowDown'). Supports key combinations like 'Control+a'.
- type: Type text into an element
- fill_form: Fill multiple form fields at once
- evaluate: Execute JavaScript in browser context
- screenshot: Take a screenshot of the page
- save_pdf: Save the current page as a PDF file. Returns the PDF content encoded in base64.
- console_messages: Get browser console messages (for Next.js, prefer nextjs_index/nextjs_call tools instead)
- handle_dialog: Handle browser dialogs (alert, confirm, prompt). Use dialogAction='accept' or 'dismiss'. For prompts, use promptText to enter text.
- close: Close the browser
- drag: Perform drag and drop
- upload_file: Upload files
- new_tab: Open a new browser tab (optionally with a URL)
- list_tabs: List all open browser tabs with their IDs and URLs
- switch_tab: Switch to a specific tab by ID (use tabId parameter)
- close_tab: Close a specific tab by ID (use tabId parameter)
- list_tools: List all available browser automation tools from the server

Note: The playwright-mcp server will be automatically installed if not present.`,
}

type BrowserEvalArgs = {
  action:
    | "start"
    | "navigate"
    | "go_back"
    | "snapshot"
    | "wait"
    | "click"
    | "click_xy"
    | "hover"
    | "move_xy"
    | "drag_xy"
    | "press_key"
    | "type"
    | "fill_form"
    | "evaluate"
    | "screenshot"
    | "save_pdf"
    | "console_messages"
    | "handle_dialog"
    | "close"
    | "drag"
    | "upload_file"
    | "new_tab"
    | "list_tabs"
    | "switch_tab"
    | "close_tab"
    | "list_tools"
  browser?: "chrome" | "firefox" | "webkit" | "msedge"
  headless?: boolean | string
  url?: string
  element?: string
  ref?: string
  doubleClick?: boolean | string
  button?: "left" | "right" | "middle"
  modifiers?: string[]
  text?: string
  fields?: Array<{ selector: string; value: string }>
  script?: string
  fullPage?: boolean | string
  errorsOnly?: boolean | string
  startElement?: string
  startRef?: string
  endElement?: string
  endRef?: string
  files?: string[]
  time?: number
  tabId?: string
  key?: string
  dialogAction?: "accept" | "dismiss"
  promptText?: string
  // Coordinate-based actions
  x?: number
  y?: number
  startX?: number
  startY?: number
  endX?: number
  endY?: number
}

export async function handler(args: BrowserEvalArgs): Promise<string> {
  try {
    if (args.action === "start") {
      await startBrowserEvalMCP({
        browser: args.browser || "chrome",
        headless: args.headless !== false,
      })
      return JSON.stringify({
        success: true,
        message: `Browser automation started (${args.browser || "chrome"}, headless: ${
          args.headless !== false
        })`,
        connection: "connected",
        verbose_logging: "Verbose logging enabled - Browser automation logs will appear in stderr",
      })
    }

    if (args.action === "list_tools") {
      const connection = getBrowserEvalConnection()
      if (!connection) {
        return JSON.stringify({
          success: false,
          error: "Browser automation not started. Use action='start' first.",
        })
      }

      const tools = await listServerTools(connection)
      return JSON.stringify({
        success: true,
        tools,
        message: `Found ${tools.length} tools available in playwright-mcp`,
      })
    }

    if (args.action === "close") {
      await stopBrowserEvalMCP()
      return JSON.stringify({
        success: true,
        message: "Browser automation closed",
      })
    }

    const connection = getBrowserEvalConnection()
    if (!connection) {
      return JSON.stringify({
        success: false,
        error: "Browser automation not started. Use action='start' first.",
      })
    }

    let toolName: string
    let toolArgs: Record<string, unknown>

    switch (args.action) {
      case "navigate":
        if (!args.url) {
          throw new Error("URL is required for navigate action")
        }
        toolName = "browser_navigate"
        toolArgs = { url: args.url }
        break

      case "go_back":
        toolName = "browser_navigate_back"
        toolArgs = {}
        break

      case "snapshot":
        toolName = "browser_snapshot"
        toolArgs = {}
        break

      case "wait":
        if (!args.time) {
          throw new Error("time (in milliseconds) is required for wait action")
        }
        toolName = "browser_wait_for"
        toolArgs = { time: args.time }
        break

      case "click":
        if (!args.element && !args.ref) {
          throw new Error("element or ref is required for click action")
        }
        toolName = "browser_click"
        toolArgs = {
          element: args.element,
          ref: args.ref,
          doubleClick: args.doubleClick,
          button: args.button,
          modifiers: args.modifiers,
        }
        break

      case "hover":
        if (!args.element && !args.ref) {
          throw new Error("element or ref is required for hover action")
        }
        toolName = "browser_hover"
        toolArgs = {
          element: args.element,
          ref: args.ref,
        }
        break

      case "press_key":
        if (!args.key) {
          throw new Error("key is required for press_key action")
        }
        toolName = "browser_press_key"
        toolArgs = { key: args.key }
        break

      case "type":
        if (!args.text) {
          throw new Error("Text is required for type action")
        }
        toolName = "browser_type"
        toolArgs = {
          element: args.element,
          ref: args.ref,
          text: args.text,
        }
        break

      case "fill_form":
        if (!args.fields) {
          throw new Error("Fields are required for fill_form action")
        }
        toolName = "browser_fill_form"
        toolArgs = { fields: args.fields }
        break

      case "evaluate":
        if (!args.script) {
          throw new Error("Script is required for evaluate action")
        }
        toolName = "browser_evaluate"
        // Wrap script as arrow function for playwright-mcp compatibility
        toolArgs = {
          function: `() => { ${args.script} }`,
          element: args.element,
          ref: args.ref,
        }
        break

      case "screenshot":
        toolName = "browser_take_screenshot"
        toolArgs = { fullPage: args.fullPage }
        break

      case "save_pdf":
        toolName = "browser_pdf_save"
        toolArgs = {}
        break

      case "console_messages":
        toolName = "browser_console_messages"
        toolArgs = { errorsOnly: args.errorsOnly }
        break

      case "handle_dialog":
        if (!args.dialogAction) {
          throw new Error("dialogAction ('accept' or 'dismiss') is required for handle_dialog action")
        }
        toolName = "browser_handle_dialog"
        toolArgs = {
          accept: args.dialogAction === "accept",
          promptText: args.promptText,
        }
        break

      case "drag":
        if (!args.startElement || !args.endElement) {
          throw new Error("startElement and endElement are required for drag action")
        }
        toolName = "browser_drag"
        toolArgs = {
          startElement: args.startElement,
          startRef: args.startRef,
          endElement: args.endElement,
          endRef: args.endRef,
        }
        break

      case "upload_file":
        toolName = "browser_file_upload"
        toolArgs = { files: args.files }
        break

      case "new_tab": {
        // Create the new tab first
        const createResult = await callServerTool(connection, "browser_tabs", { action: "new" })
        // If URL provided, navigate to it in the new tab
        if (args.url) {
          const navResult = await callServerTool(connection, "browser_navigate", { url: args.url })
          return JSON.stringify({
            success: true,
            action: args.action,
            result: { created: createResult, navigated: navResult },
          })
        }
        return JSON.stringify({
          success: true,
          action: args.action,
          result: createResult,
        })
      }

      case "list_tabs":
        toolName = "browser_tabs"
        toolArgs = { action: "list" }
        break

      case "switch_tab":
        if (!args.tabId) {
          throw new Error("tabId is required for switch_tab action")
        }
        toolName = "browser_tabs"
        toolArgs = { action: "select", index: parseInt(args.tabId, 10) }
        break

      case "close_tab":
        if (!args.tabId) {
          throw new Error("tabId is required for close_tab action")
        }
        toolName = "browser_tabs"
        toolArgs = { action: "close", index: parseInt(args.tabId, 10) }
        break

      // Coordinate-based actions (vision mode) - require element description for permission
      case "click_xy":
        if (!args.element) {
          throw new Error("element description is required for click_xy action (e.g., 'Submit button')")
        }
        if (args.x === undefined || args.y === undefined) {
          throw new Error("x and y coordinates are required for click_xy action")
        }
        toolName = "browser_mouse_click_xy"
        toolArgs = { element: args.element, x: args.x, y: args.y }
        break

      case "move_xy":
        if (!args.element) {
          throw new Error("element description is required for move_xy action (e.g., 'Navigation menu')")
        }
        if (args.x === undefined || args.y === undefined) {
          throw new Error("x and y coordinates are required for move_xy action")
        }
        toolName = "browser_mouse_move_xy"
        toolArgs = { element: args.element, x: args.x, y: args.y }
        break

      case "drag_xy":
        if (!args.element) {
          throw new Error("element description is required for drag_xy action (e.g., 'Slider handle')")
        }
        if (args.startX === undefined || args.startY === undefined ||
            args.endX === undefined || args.endY === undefined) {
          throw new Error("startX, startY, endX, and endY are required for drag_xy action")
        }
        toolName = "browser_mouse_drag_xy"
        toolArgs = { element: args.element, startX: args.startX, startY: args.startY, endX: args.endX, endY: args.endY }
        break

      default:
        throw new Error(`Unknown action: ${args.action}`)
    }

    const result = await callServerTool(connection, toolName, toolArgs)

    return JSON.stringify({
      success: true,
      action: args.action,
      result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return JSON.stringify({
      success: false,
      error: errorMessage,
      action: args.action,
    })
  }
}
