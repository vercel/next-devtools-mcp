import { tool } from "ai"
import { z } from "zod"

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

  inputSchema: enableCacheComponentsInputSchema,

  execute: async (args: z.infer<typeof enableCacheComponentsInputSchema>): Promise<string> => {
    try {
      const projectPath = args.project_path || process.cwd()

      // Return concise guidance that references MCP resources instead of embedding them
      return JSON.stringify({
        success: true,
        project_path: projectPath,
        description: "Cache Components Setup Guide",
        type: "structured_guidance",
        
        overview: "This tool guides you through enabling Cache Components in Next.js 16. The process is automated and iterative, with real-time error detection and fixing.",
        
        phases: [
          {
            name: "Phase 1: Pre-Flight Checks",
            tasks: [
              "Verify Next.js 16.0.0+ is installed (stable or canary only - beta NOT supported)",
              "Check for clean working directory (git status)",
              "Ensure no conflicting experimental flags",
            ],
          },
          {
            name: "Phase 2: Enable Cache Components Configuration",
            tasks: [
              "Update next.config.js with cacheComponents flag (experimental.cacheComponents for 16.0.0 stable, cacheComponents for canary > 16)",
              "Remove incompatible flags (staticGeneration, dynamicIO, ppr)",
              "Migrate Route Segment Config if needed",
            ],
          },
          {
            name: "Phase 3: Start Dev Server with MCP",
            tasks: [
              "Start dev server with __NEXT_EXPERIMENTAL_MCP_SERVER=true",
              "Verify MCP server is running",
              "Note: Keep server running throughout the process",
            ],
          },
          {
            name: "Phase 4: Route Verification & Error Detection",
            tasks: [
              "Use browser_eval to load all routes in browser",
              "Collect errors using Next.js MCP get_errors tool",
              "Categorize errors by type (Suspense, async params, etc.)",
            ],
          },
          {
            name: "Phase 5: Automated Error Fixing",
            tasks: [
              "Add Suspense boundaries where needed",
              "Add 'use cache' directives to components/functions",
              "Convert params/searchParams to async",
              "Add generateStaticParams for dynamic routes",
              "Configure cacheLife profiles",
              "Add cache tags for invalidation",
            ],
          },
          {
            name: "Phase 6: Final Verification",
            tasks: [
              "Re-run all routes through browser",
              "Verify zero errors remain",
              "Test Fast Refresh with changes",
              "Confirm build succeeds",
            ],
          },
        ],
        
        key_features: [
          "One-time dev server start (no restarts needed)",
          "Automated error detection using Next.js MCP tools",
          "Browser-based testing with browser automation",
          "Fast Refresh applies fixes instantly",
          "Comprehensive fix strategies for all error types",
        ],
        
        available_resources: {
          note: "Use MCP resources for detailed knowledge",
          resources: [
            "nextjs-16-knowledge/00-overview.md - Critical errors and quick reference",
            "nextjs-16-knowledge/01-core-mechanics.md - Fundamental paradigm shift",
            "nextjs-16-knowledge/02-public-caches.md - 'use cache' mechanics",
            "nextjs-16-knowledge/03-private-caches.md - 'use cache: private' mechanics",
            "nextjs-16-knowledge/04-runtime-prefetching.md - Dynamic prefetch patterns",
            "nextjs-16-knowledge/06-request-apis.md - Async params, cookies, headers",
            "nextjs-16-knowledge/07-cache-invalidation.md - updateTag, revalidateTag",
            "nextjs-16-knowledge/08-advanced-patterns.md - cacheLife, cacheTag, draft mode",
            "nextjs-16-knowledge/09-build-behavior.md - Static generation & build-time",
            "nextjs-16-knowledge/10-error-patterns.md - Common errors & solutions",
            "nextjs-16-knowledge/11-test-patterns.md - Real test-driven examples",
            "nextjs-16-knowledge/12-reference.md - Complete API reference",
          ],
        },
        
        quick_start: {
          step_1: "Check prerequisites: Next.js 16.0.0+ stable or canary (NOT beta), clean git status",
          step_2: "Enable cacheComponents in next.config.js",
          step_3: "Start dev server with __NEXT_EXPERIMENTAL_MCP_SERVER=true pnpm dev",
          step_4: "Use browser_eval to test routes and get_errors to collect issues",
          step_5: "Fix errors iteratively using Fast Refresh (no restart needed)",
          step_6: "Verify all routes work with zero errors",
        },
        
        common_errors: [
          {
            error: "Cannot access async locals on component",
            solution: "Wrap component in Suspense boundary or add 'use cache'",
          },
          {
            error: "params/searchParams must be awaited",
            solution: "Convert to async and await: const { id } = await params",
          },
          {
            error: "Dynamic route needs generateStaticParams",
            solution: "Add generateStaticParams to generate static paths at build time",
          },
          {
            error: "Client component cannot be async",
            solution: "Move async logic to Server Component and pass as props",
          },
        ],
        
        next_steps: "Start with Phase 1. Use the available MCP resources (listed above) to access detailed knowledge as needed for each phase.",
      }, null, 2)
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
