export { nextjsDocsTool } from "./nextjs-docs.js"
export { playwrightTool } from "./playwright.js"
export { nextjsVerifyTool } from "./nextjs-verify.js"

// Export tools registry
import { nextjsDocsTool } from "./nextjs-docs.js"
import { playwrightTool } from "./playwright.js"
// import { nextjsVerifyTool } from "./nextjs-verify.js"

export const MCP_TOOLS = {
  nextjs_docs: nextjsDocsTool,
  playwright: playwrightTool,
  // nextjs_verify: nextjsVerifyTool,
} as const

