export { nextjsDocsTool } from "./nextjs-docs.js"
export { browserEvalTool } from "./browser_eval.js"
export { nextjsRuntimeTool } from "./nextjs-runtime.js"
export { upgradeNextjs16Tool } from "./upgrade-nextjs-16.js"
export { enableCacheComponentsTool } from "./enable-cache-components.js"

// Export tools registry
import { nextjsDocsTool } from "./nextjs-docs.js"
import { browserEvalTool } from "./browser_eval.js"
import { nextjsRuntimeTool } from "./nextjs-runtime.js"
import { upgradeNextjs16Tool } from "./upgrade-nextjs-16.js"
import { enableCacheComponentsTool } from "./enable-cache-components.js"

export const MCP_TOOLS = {
  nextjs_docs: nextjsDocsTool,
  browser_eval: browserEvalTool,
  nextjs_runtime: nextjsRuntimeTool,
  upgrade_nextjs_16: upgradeNextjs16Tool,
  enable_cache_components: enableCacheComponentsTool,
} as const

