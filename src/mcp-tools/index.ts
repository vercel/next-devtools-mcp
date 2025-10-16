export { nextjsDocsTool } from "./nextjs-docs.js"
export { playwrightTool } from "./playwright.js"

// Export tools registry
import { nextjsDocsTool } from "./nextjs-docs.js"
import { playwrightTool } from "./playwright.js"

export const MCP_TOOLS = {
  nextjs_docs: nextjsDocsTool,
  playwright: playwrightTool,
} as const

