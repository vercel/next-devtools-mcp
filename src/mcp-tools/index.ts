export { nextjsDocsTool } from "./nextjs-docs.js"
export { chromeDevToolsTool } from "./chrome-devtools.js"
export { nextjsVerifyTool } from "./nextjs-verify.js"

// Export tools registry
import { nextjsDocsTool } from "./nextjs-docs.js"
import { chromeDevToolsTool } from "./chrome-devtools.js"
// import { nextjsVerifyTool } from "./nextjs-verify.js"

export const MCP_TOOLS = {
  nextjs_docs: nextjsDocsTool,
  chrome_devtools: chromeDevToolsTool,
  // nextjs_verify: nextjsVerifyTool,
} as const

