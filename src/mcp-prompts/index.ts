import type { Prompt } from "@modelcontextprotocol/sdk/types.js"
import { upgradeNextjs16Prompt, getUpgradeNextjs16Prompt } from "./upgrade-nextjs-16.js"
import {
  enableCacheComponentsPrompt,
  getEnableCacheComponentsPrompt,
} from "./enable-cache-components.js"
import {
  preloadNextjs16KnowledgePrompt,
  getPreloadNextjs16KnowledgePrompt,
} from "./preload-nextjs-16-knowledge.js"

// Export individual prompts
export { upgradeNextjs16Prompt, getUpgradeNextjs16Prompt } from "./upgrade-nextjs-16.js"
export {
  enableCacheComponentsPrompt,
  getEnableCacheComponentsPrompt,
} from "./enable-cache-components.js"
export {
  preloadNextjs16KnowledgePrompt,
  getPreloadNextjs16KnowledgePrompt,
} from "./preload-nextjs-16-knowledge.js"

// Prompts registry
export const MCP_PROMPTS: Record<string, Prompt> = {
  "upgrade-nextjs-16": upgradeNextjs16Prompt,
  "enable-cache-components": enableCacheComponentsPrompt,
  "preload-nextjs-16-knowledge": preloadNextjs16KnowledgePrompt,
}

// Prompt handlers registry
export const PROMPT_HANDLERS: Record<
  string,
  (args?: Record<string, string>) => ReturnType<typeof getUpgradeNextjs16Prompt>
> = {
  "upgrade-nextjs-16": getUpgradeNextjs16Prompt,
  "enable-cache-components": getEnableCacheComponentsPrompt,
  "preload-nextjs-16-knowledge": getPreloadNextjs16KnowledgePrompt,
}

