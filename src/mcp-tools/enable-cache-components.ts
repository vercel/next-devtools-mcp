import { tool } from "ai"
import { z } from "zod"
import { getEnableCacheComponentsPrompt } from "../mcp-prompts/enable-cache-components.js"

/**
 * Enable Cache Components in Next.js 16 MCP Tool
 *
 * This tool guides through complete Cache Components setup and enablement,
 * including configuration, error detection, and automated fixes.
 */
const enableCacheComponentsInputSchema = z.object({
  project_path: z
    .string()
    .optional()
    .describe("Path to the Next.js project (defaults to current directory)"),
})

export const enableCacheComponentsTool = tool({
  description: `Complete Cache Components setup for Next.js 16.

Handles ALL steps for enabling and verifying Cache Components:
- Configuration: Updates experimental.cacheComponents flag, removes incompatible flags
- Dev Server: Starts dev server with MCP enabled (__NEXT_EXPERIMENTAL_MCP_SERVER=true)
- Error Detection: Loads all routes via Playwright, collects errors using Next.js MCP
- Automated Fixing: Adds Suspense boundaries, "use cache" directives, generateStaticParams, cacheLife profiles, cache tags
- Verification: Validates all routes work with zero errors

Key Features:
- One-time dev server start (no restarts needed)
- Automated error detection using Next.js MCP tools
- Browser-based testing with Playwright
- Fast Refresh applies fixes instantly
- Comprehensive fix strategies for all error types
- Support for "use cache", "use cache: private", Suspense boundaries
- Cache invalidation with cacheTag() and cacheLife() configuration

Requires:
- Next.js 16.0.0+
- Clean working directory preferred
- Playwright installed (auto-installed if needed)

This tool embeds complete knowledge base for:
- Cache Components mechanics
- Error patterns and solutions
- Caching strategies (static vs dynamic)
- Advanced patterns (cacheLife, cacheTag, draft mode)
- Build behavior and prefetching
- Test-driven patterns from 125+ fixtures`,

  inputSchema: enableCacheComponentsInputSchema,

  execute: async (args: z.infer<typeof enableCacheComponentsInputSchema>): Promise<string> => {
    try {
      const projectPath = args.project_path || process.cwd()

      // Get the full prompt content with all embedded resources
      const promptResult = getEnableCacheComponentsPrompt({ project_path: projectPath })

      // Extract the prompt text
      const promptText = promptResult.messages[0].content.type === "text"
        ? promptResult.messages[0].content.text
        : ""

      // Return the prompt as structured guidance
      return JSON.stringify({
        success: true,
        project_path: projectPath,
        description: "Cache Components Setup Guide",
        guidance: promptText,
        type: "structured_guidance_with_embedded_knowledge",
        phases: [
          "Phase 1: Pre-Flight Checks",
          "Phase 2: Enable Cache Components Configuration",
          "Phase 3: Start Dev Server with MCP",
          "Phase 4: Route Verification & Error Detection",
          "Phase 5: Automated Error Fixing & Boundary Setup",
          "Phase 6: Final Verification",
        ],
        embedded_resources: [
          "Cache Components overview",
          "Core mechanics and paradigm shift",
          "Public and private cache mechanisms",
          "Runtime prefetching patterns",
          "Request APIs (async params, cookies, headers)",
          "Cache invalidation strategies",
          "Advanced patterns (cacheLife, cacheTag, draft mode)",
          "Build behavior and static shells",
          "Error patterns and solutions",
          "Test-driven examples",
          "Complete API reference",
        ],
        note: "This tool provides detailed step-by-step guidance with embedded knowledge base. Follow the phases in order for successful Cache Components enablement.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return JSON.stringify({
        success: false,
        error: errorMessage,
        details: "Failed to load Cache Components setup guidance",
      })
    }
  },
})
