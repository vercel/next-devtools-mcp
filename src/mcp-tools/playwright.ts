import { tool } from "ai"
import { z } from "zod"
import { startPlaywrightMCP, stopPlaywrightMCP, getPlaywrightConnection } from "../lib/playwright-manager.js"
import { callServerTool, listServerTools } from "../lib/mcp-client.js"

// Playwright Tool Schema
const playwrightInputSchema = z.object({
  action: z
    .enum([
      "start",
      "navigate",
      "click",
      "type",
      "fill_form",
      "evaluate",
      "screenshot",
      "console_messages",
      "close",
      "drag",
      "upload_file",
      "list_tools",
    ])
    .describe("The action to perform using Playwright"),

  // Start action options
  browser: z
    .enum(["chrome", "firefox", "webkit", "msedge"])
    .optional()
    .describe("Browser to use (default: chrome). Only used with 'start' action."),
  headless: z
    .boolean()
    .optional()
    .describe("Run browser in headless mode (default: true). Only used with 'start' action."),

  // Navigation
  url: z.string().optional().describe("URL to navigate to (required for 'navigate' action)"),

  // Click action
  element: z.string().optional().describe("Element to interact with (CSS selector or text)"),
  ref: z.string().optional().describe("Reference to element from accessibility snapshot"),
  doubleClick: z.boolean().optional().describe("Perform double click instead of single click"),
  button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button to use"),
  modifiers: z.array(z.string()).optional().describe("Keyboard modifiers (e.g., ['Control', 'Shift'])"),

  // Type/fill action
  text: z.string().optional().describe("Text to type into element"),

  // Fill form action
  fields: z
    .array(
      z.object({
        selector: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .describe("Array of fields to fill in a form"),

  // Evaluate action
  script: z.string().optional().describe("JavaScript code to evaluate in browser context"),

  // Screenshot action
  fullPage: z.boolean().optional().describe("Take full page screenshot"),

  // Console messages
  errorsOnly: z.boolean().optional().describe("Only return error messages from console"),

  // Drag action
  startElement: z.string().optional().describe("Starting element for drag operation"),
  startRef: z.string().optional().describe("Starting element reference"),
  endElement: z.string().optional().describe("Ending element for drag operation"),
  endRef: z.string().optional().describe("Ending element reference"),

  // File upload
  files: z.array(z.string()).optional().describe("File paths to upload"),
})

export const playwrightTool = tool({
  description: `Automate and test web applications using Playwright browser automation.
This tool connects to playwright-mcp server and provides access to all Playwright capabilities.

IMPORTANT FOR NEXT.JS PROJECTS:
If working with a Next.js application, PRIORITIZE using the 'nextjs_runtime' tool instead of browser console log forwarding.
Next.js has built-in MCP integration that provides superior error reporting, build diagnostics, and runtime information
directly from the Next.js dev server. Only use Playwright's console_messages action as a fallback when nextjs_runtime
tools are not available or when you specifically need to test client-side browser behavior that Next.js runtime cannot capture.

Available actions:
- start: Start Playwright browser (automatically installs if needed)
- navigate: Navigate to a URL
- click: Click on an element
- type: Type text into an element
- fill_form: Fill multiple form fields at once
- evaluate: Execute JavaScript in browser context
- screenshot: Take a screenshot of the page
- console_messages: Get browser console messages (for Next.js, prefer nextjs_runtime tool instead)
- close: Close the browser
- drag: Perform drag and drop
- upload_file: Upload files
- list_tools: List all available Playwright tools from the server

Note: The playwright-mcp server will be automatically installed if not present.`,
  inputSchema: playwrightInputSchema,
  execute: async (args: z.infer<typeof playwrightInputSchema>): Promise<string> => {
    try {
      // Handle start action
      if (args.action === "start") {
        const connection = await startPlaywrightMCP({
          browser: args.browser || "chrome",
          headless: args.headless !== false, // Default to true
        })
        return JSON.stringify({
          success: true,
          message: `Playwright browser started (${args.browser || "chrome"}, headless: ${args.headless !== false})`,
          connection: "connected",
        })
      }

      // Handle list_tools action
      if (args.action === "list_tools") {
        const connection = getPlaywrightConnection()
        if (!connection) {
          return JSON.stringify({
            success: false,
            error: "Playwright not started. Use action='start' first.",
          })
        }

        const tools = await listServerTools(connection)
        return JSON.stringify({
          success: true,
          tools,
          message: `Found ${tools.length} tools available in playwright-mcp`,
        })
      }

      // Handle close action
      if (args.action === "close") {
        await stopPlaywrightMCP()
        return JSON.stringify({
          success: true,
          message: "Playwright browser closed",
        })
      }

      // For all other actions, we need an active connection
      const connection = getPlaywrightConnection()
      if (!connection) {
        return JSON.stringify({
          success: false,
          error: "Playwright not started. Use action='start' first.",
        })
      }

      // Map actions to playwright-mcp tool names
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

        case "click":
          toolName = "browser_click"
          toolArgs = {
            element: args.element,
            ref: args.ref,
            doubleClick: args.doubleClick,
            button: args.button,
            modifiers: args.modifiers,
          }
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
          toolArgs = {
            function: args.script,
            element: args.element,
            ref: args.ref,
          }
          break

        case "screenshot":
          toolName = "browser_screenshot"
          toolArgs = { fullPage: args.fullPage }
          break

        case "console_messages":
          toolName = "browser_console_messages"
          toolArgs = { errorsOnly: args.errorsOnly }
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

        default:
          throw new Error(`Unknown action: ${args.action}`)
      }

      // Call the tool on playwright-mcp server
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
  },
})
