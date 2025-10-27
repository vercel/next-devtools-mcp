import { type InferSchema } from "xmcp"
import { z } from "zod"
import getEnableCacheComponentsPrompt from "../prompts/enable-cache-components"

export const schema = {
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
}

export const metadata = {
  name: "enable_cache_components",
  description: `Complete Cache Components setup for Next.js 16.

Handles ALL steps for enabling and verifying Cache Components:
- Configuration: Updates cacheComponents flag (experimental in 16.0.0, stable in canary > 16), removes incompatible flags
- Dev Server: Starts dev server with MCP enabled (__NEXT_EXPERIMENTAL_MCP_SERVER=true)
- Error Detection: Loads all routes via browser automation, collects errors using Next.js MCP
- Automated Fixing: Adds Suspense boundaries, "use cache" directives, generateStaticParams, cacheLife profiles, cache tags
- Verification: Validates all routes work with zero errors

Key Features:
- One-time dev server start (no restarts needed)
- Automated error detection using Next.js MCP tools
- Browser-based testing with browser automation
- Fast Refresh applies fixes instantly
- Comprehensive fix strategies for all error types
- Support for "use cache", "use cache: private", Suspense boundaries
- Cache invalidation with cacheTag() and cacheLife() configuration

Requires:
- Next.js 16.0.0+ (stable or canary only - beta versions are NOT supported)
- Clean working directory preferred
- Browser automation installed (auto-installed if needed)

This tool embeds complete knowledge base for:
- Cache Components mechanics
- Error patterns and solutions
- Caching strategies (static vs dynamic)
- Advanced patterns (cacheLife, cacheTag, draft mode)
- Build behavior and prefetching
- Test-driven patterns from 125+ fixtures`,
}

export default async function enableCacheComponents(
  args: InferSchema<typeof schema>
): Promise<string> {
  try {
    const projectPath = args.project_path || process.cwd()

    const promptText = getEnableCacheComponentsPrompt({ project_path: projectPath })

    return JSON.stringify({
      success: true,
      project_path: projectPath,
      description: "Cache Components Setup Guide",
      guidance: promptText,
      type: "structured_guidance",
      note: "This tool provides detailed step-by-step guidance. Follow the phases in order for successful Cache Components setup.",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return JSON.stringify({
      success: false,
      error: errorMessage,
      details: "Failed to load Cache Components setup guidance",
    })
  }
}
