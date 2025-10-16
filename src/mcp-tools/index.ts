export { nextjsDocsTool } from "./nextjs-docs.js"
export { playwrightTool } from "./playwright.js"
export { nextjsRuntimeTool } from "./nextjs-runtime.js"

// Export tools registry
import { nextjsDocsTool } from "./nextjs-docs.js"
import { playwrightTool } from "./playwright.js"
import { nextjsRuntimeTool } from "./nextjs-runtime.js"

export const MCP_TOOLS = {
  nextjs_docs: nextjsDocsTool,
  playwright: playwrightTool,
  nextjs_runtime: nextjsRuntimeTool,
} as const

