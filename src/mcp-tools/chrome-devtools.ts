import { tool } from "ai"
import { z } from "zod"

// Chrome DevTools Tool (simplified - proxies to chrome-devtools-mcp)
const chromeDevToolsInputSchema = z.object({
  action: z
    .enum([
      "start_browser",
      "close_browser",
      "navigate",
      "evaluate",
      "screenshot",
      "console",
      "performance_start",
      "performance_stop",
      "performance_analyze",
      "close_page",
    ])
    .describe("The action to perform using Chrome DevTools"),
  url: z.string().optional().describe("URL to navigate to (required for 'navigate' action)"),
  script: z
    .string()
    .optional()
    .describe("JavaScript code to evaluate (required for 'evaluate' action)"),
  pageIdx: z.number().optional().describe("Page index to close (required for 'close_page' action)"),
  headless: z
    .boolean()
    .optional()
    .default(false)
    .describe("Run Chrome in headless mode (default: false)"),
  isolated: z
    .boolean()
    .optional()
    .default(true)
    .describe("Use isolated temporary profile (default: true, recommended for testing)"),
})

export const chromeDevToolsTool = tool({
  description: `Automate and test web applications using Chrome DevTools.
Note: This tool requires chrome-devtools-mcp to be installed (npm install -g chrome-devtools-mcp)`,
  inputSchema: chromeDevToolsInputSchema,
  execute: async (args: z.infer<typeof chromeDevToolsInputSchema>): Promise<string> => {
    return `Chrome DevTools functionality not available in standalone MCP server.
Action requested: ${args.action}`
  },
})

