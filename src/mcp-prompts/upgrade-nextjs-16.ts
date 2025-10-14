import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { atom, group, informationToXml } from "./utils/prompt-dsl.js"
import { nextjs16KnowledgeBase } from "./shared/nextjs-16-knowledge.js"

export const upgradeNextjs16Prompt: Prompt = {
  name: "upgrade-nextjs-16",
  description:
    "Guide through upgrading Next.js to version 16 beta. Runs the official codemod first for automatic fixes, then handles remaining issues manually. Covers async API changes, config moves, image defaults, parallel routes, and deprecations.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (e.g., /path/to/app)",
      required: false,
    },
  ],
}

export function getUpgradeNextjs16Prompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()

  // TEMPORARY: Set to false once Next.js 16 beta supports experimental.cacheComponents
  const REQUIRES_CANARY_FOR_CACHE_COMPONENTS = true

  // Build structured prompt using DSL
  const promptStructure = group({
    subject: "nextjs_16_upgrade",
    description: "Migrate a pre-existing Next.js project to Next.js 16.",
    value: () => [
      atom({
        subject: "context",
        description: "Project context",
        value: `You are a Next.js upgrade assistant. Help upgrade this project from Next.js 15 (or earlier) to Next.js 16.

PROJECT: ${projectPath}`,
      }),

      nextjs16KnowledgeBase,

      group({
        subject: "phase_1",
        description: "Pre-Flight Checks (REQUIRED)",
        value: [
          atom({
                subject: "introduction",
                description: "What to check before upgrading",
                value: "Check these BEFORE upgrading:",
              }),
              atom({
                subject: "package_manager_detection",
                description: "Detect package manager",
                value: `**Detect Package Manager**
 Check: package.json "packageManager" field or lock files
 
 **Template Variables:**
 \`\`\`
 npm:   <pkg-manager> = npm        <pkg-exec> = npx
 pnpm:  <pkg-manager> = pnpm       <pkg-exec> = pnpx
 yarn:  <pkg-manager> = yarn       <pkg-exec> = yarn dlx
 bun:   <pkg-manager> = bun        <pkg-exec> = bunx
 \`\`\`
 
 Use these template variables in ALL commands below for consistency`,
              }),
              atom({
                subject: "nodejs_version",
                description: "Node.js version requirement",
                value: `**Node.js Version**
 Required: Node.js 20+
 Check: node --version
 Action: Upgrade if < 20`,
              }),
              atom({
                subject: "typescript_version",
                description: "TypeScript version requirement",
                value: `**TypeScript Version**
 Required: TypeScript 5.0+
 Check: package.json → devDependencies.typescript
 Action: If exists and < 5.0, upgrade with detected package manager`,
              }),
              atom({
                subject: "react_dependencies",
                description: "React and type definitions upgrade",
                value: `**React and Type Definitions**
 Action: Upgrade React and type definitions using the detected package manager:
 \`\`\`bash
 <pkg-manager> add react@latest react-dom@latest
 <pkg-manager> add -D @types/react@latest @types/react-dom@latest
 \`\`\``,
              }),
              atom({
                subject: "nextjs_version",
                description: "Document current Next.js version",
                value: `**Current Next.js Version**
 Check: package.json → dependencies.next
 Note: Document current version for rollback`,
              }),
            ],
          }),

          group({
            subject: "phase_2",
            description: "Run Automated Codemod",
            value: () => {
              const items = [
                atom({
                  subject: "codemod_instructions",
                  description: "Run codemod",
                  value: `Run the official codemod first to handle most changes automatically:
 
 \`\`\`bash
 # This will:
 # - Upgrade Next.js, React, and React DOM to latest versions
 # - Convert async params/searchParams automatically
 # - Update experimental config locations
 # - Fix other breaking changes
 <pkg-exec> @next/codemod@canary upgrade beta
 \`\`\`
 
 **What the codemod handles:**
 - ✅ Converts sync params/searchParams to async (most cases)
 - ✅ Updates experimental config locations
 - ✅ Fixes metadata generation functions
 - ✅ Updates deprecated imports
 
 **Wait for codemod to complete before proceeding to Phase 3**`,
                }),
              ]

              const canaryUpgradeAtom = atom({
                subject: "canary_upgrade",
                description: "Temporary upgrade to canary for cacheComponents support",
                value: `**⚠️ TEMPORARY: Upgrade to Canary (Required for cacheComponents)**

 The beta version doesn't support \`experimental.cacheComponents\` yet. If your project uses \`'use cache'\` directives or needs cacheComponents, upgrade to canary:

 \`\`\`bash
 <pkg-manager> add next@canary
 <pkg-manager> add -D eslint-config-next@canary
 \`\`\``,
              })

              if (REQUIRES_CANARY_FOR_CACHE_COMPONENTS) {
                items.push(canaryUpgradeAtom)
              }

              return items
            },
          }),

          group({
            subject: "phase_3",
            description: "Analyze Remaining Issues",
            value: [
              atom({
                subject: "introduction",
                description: "Manual check checklist introduction",
                value:
                  "After the codemod runs, check for any remaining issues it might have missed:\n\n### Manual Check Checklist:",
              }),
              atom({
                subject: "parallel_routes",
                description: "Parallel routes require default.js files",
                value: `**A. Parallel Routes (NOT handled by codemod)**
 Files: Check for @ folders
 Requirement: All parallel route slots must have \`default.js\` files
 Impact: Build fails without them
 
 Fix if missing:
 \`\`\`typescript
 // Create: app/@modal/default.js
 export default function Default() {
   return null
 }
 \`\`\``,
              }),
              atom({
                subject: "image_security_config",
                description: "Image security configuration for local images",
                value: `**B. Image Security Config (NOT handled by codemod)**
 File: next.config.js
 Check: Are you using local images with query strings?
 
 If yes, add:
 \`\`\`diff
 + images: {
 +   localPatterns: [{ pathname: '/img/**' }]
 + }
 \`\`\``,
              }),
              atom({
                subject: "image_defaults",
                description: "Image default behavior changes",
                value: `**C. Image Default Changes (Behavior change)**
 Note: These defaults changed automatically in v16:
 - \`minimumCacheTTL\`: 60s -> 14400s (4 hours)
 - \`qualities\`: [1..100] -> [75]
 - \`imageSizes\`: removed 16
 - \`dangerouslyAllowLocalIP\`: now false by default
 - \`maximumRedirects\`: unlimited -> 3
 
 Action: Review if these affect your app, override in config if needed`,
              }),
              atom({
                subject: "lint_command_migration",
                description: "Lint command migration",
                value: `**D. Lint Command Migration (NOT handled by codemod)**
 Files: package.json scripts, CI workflows
 Check: Scripts using \`next lint\`
 Note: \`next build\` no longer runs linting automatically
 
 Options:
 1. Use Biome: \`biome check .\`
 2. Use ESLint directly: \`<pkg-exec> @next/codemod@canary next-lint-to-eslint-cli .\``,
              }),
              atom({
                subject: "turbopack_flags",
                description: "Turbopack flags no longer needed",
                value: `**E. --turbopack Flags (No Longer Needed)**
 Files: package.json scripts
 Check: \`next dev --turbopack\`, \`next build --turbopack\`
 Action: Remove \`--turbopack\` flags (Turbopack is default in v16)
 Note: Use \`--webpack\` flag if you want webpack instead`,
              }),
              atom({
                subject: "edge_cases",
                description: "Edge cases the codemod may miss",
                value: `**F. Edge Cases the Codemod May Miss**
 Review these manually:
 
 - Complex async destructuring patterns
 - Dynamic params in nested layouts
 - Route handlers with cookies()/headers() in conditionals
 - Custom metadata generation with complex logic
 
 **CRITICAL: Only change if function actually uses these 5 APIs:**
 1. \`params\` from props
 2. \`searchParams\` from props
 3. \`cookies()\` in body
 4. \`headers()\` in body
 5. \`draftMode()\` in body
 
 **Do NOT change:**
 - \`robots()\`, \`sitemap()\`, \`manifest()\` without these APIs
 - \`generateStaticParams()\`
 - Any function that doesn't use the 5 APIs above`,
              }),
              atom({
                subject: "view_transition_api",
                description: "ViewTransition API renamed",
                value: `**G. ViewTransition API Renamed (NOT handled by codemod)**
 Files: Search for imports of \`unstable_ViewTransition\` from React
 Action: Rename to \`ViewTransition\` (now stable in v16)
 
 \`\`\`diff
 - import { unstable_ViewTransition } from 'react'
 + import { ViewTransition } from 'react'
 \`\`\``,
              }),
              atom({
                subject: "revalidate_tag_api",
                description: "revalidateTag API changes",
                value: `**H. revalidateTag API Changes (Deprecation - NOT handled by codemod)**
 Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.`,
              }),
              atom({
                subject: "deprecated_features",
                description: "Deprecated features warnings",
                value: `**I. Deprecated Features (WARNINGS - Optional)**
 - \`middleware.ts\` → consider renaming to \`proxy.ts\`
 - \`next/legacy/image\` → use \`next/image\`
 - \`images.domains\` → use \`images.remotePatterns\`
 - \`unstable_rootParams()\` → being replaced`,
              }),
            ],
          }),

          group({
            subject: "phase_4",
            description: "Apply Manual Fixes",
            value: [
              atom({
                subject: "introduction",
                description: "Manual fixes based on Phase 3 analysis",
                value: `Only fix issues the codemod missed:

 Based on Phase 3 analysis, apply only the necessary manual fixes:`,
              }),
              atom({
                subject: "experimental_flags",
                description: "Fix experimental flags consolidation",
                value: `**1. Fix experimental flags consolidation (if ppr or useCache found)**
 Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.
 - Replace \`experimental.ppr\` with \`cacheComponents: true\`
 - Replace \`experimental.useCache\` with \`cacheComponents: true\``,
              }),
              atom({
                subject: "default_files",
                description: "Add missing default.js files",
                value: "**2. Add missing default.js files (if you have @ folders)**",
              }),
              atom({
                subject: "image_config",
                description: "Add image security config",
                value:
                  "**3. Add image security config (if using local images with query strings)**",
              }),
              atom({
                subject: "lint_commands",
                description: "Update lint commands",
                value: "**4. Update lint commands (if using next lint in scripts/CI)**",
              }),
              atom({
                subject: "revalidate_tag_fixes",
                description: "Fix revalidateTag calls",
                value: `**5. Fix revalidateTag calls (if compilation errors occur)**
 - Add profile parameter: \`revalidateTag(tag, 'max')\`
 - Or use \`unstable_updateTag\` for read-your-own-writes in Server Actions`,
              }),
              atom({
                subject: "edge_case_fixes",
                description: "Fix edge cases the codemod missed",
                value: `**6. Fix edge cases the codemod missed (RARE - only if found in Phase 3)**
 Template for async API fixes:
 \`\`\`diff
 - export default function Page({ params, searchParams }) {
 -   const slug = params.slug
 + export default async function Page(props) {
 +   const params = await props.params
 +   const searchParams = await props.searchParams
 +   const slug = params.slug
 \`\`\``,
              }),
            ],
          }),

          group({
            subject: "phase_5",
            description: "Test & Verify",
            value: [
              atom({
                subject: "introduction",
                description: "Testing strategy",
                value: "Run tests:",
              }),
              atom({
                subject: "dev_server",
                description: "Test dev server",
                value: `**Dev Server**
 \`\`\`bash
 __NEXT_EXPERIMENTAL_MCP_SERVER=true <pkg-manager> dev
 # Check for warnings/errors in console
 \`\`\``,
              }),
              atom({
                subject: "build",
                description: "Test build",
                value: `**Build**
 \`\`\`bash
 <pkg-manager> run build
 # Should succeed without errors
 \`\`\``,
              }),
              atom({
                subject: "production_test",
                description: "Test production",
                value: `**Production Test**
 \`\`\`bash
 <pkg-manager> start
 # Test all routes
 \`\`\``,
              }),
              atom({
                subject: "warnings",
                description: "Check for warnings",
                value: `**Check for Warnings**
 - Image component deprecation warnings
 - Runtime API warnings
 - Any other console warnings`,
              }),
            ],
          }),

          group({
            subject: "output_format",
            description: "Report format specification",
            value: () => {
              let outputFormat = `Report findings in this format:

\`\`\`
# Next.js 16 Upgrade Report

## Summary
- Current Version: [version]
- Target Version: 16
- Package Manager: [npm/pnpm/yarn/bun]

## Phase 1: Pre-Flight Checks
[ ] Node.js version (20+)
[ ] TypeScript version (5.0+)
[ ] React dependencies upgraded to @latest (even if on v19)
[ ] React type definitions upgraded to @latest
[ ] Current Next.js version documented
`

              outputFormat += `
## Phase 2: Codemod Execution
- [ ] Ran codemod: \`<pkg-exec> @next/codemod@canary upgrade beta\`
`
              if (REQUIRES_CANARY_FOR_CACHE_COMPONENTS) {
                outputFormat += `- [ ] Upgraded to canary: \`<pkg-manager> add next@canary\`
- [ ] Upgraded eslint-config-next: \`<pkg-manager> add -D eslint-config-next@canary\`
`
              }
              outputFormat += `- [ ] Dependencies upgraded
- [ ] Automatic fixes applied
`

              outputFormat += `
## Phase 3: Issues Requiring Manual Fixes
Issues the codemod couldn't handle:

[ ] Experimental flags consolidation (ppr/useCache → cacheComponents)
[ ] Parallel routes missing default.js
[ ] Image security config needed
[ ] Lint commands to update
[ ] revalidateTag API changes
[ ] Edge cases in async APIs
[ ] Deprecated features to update

## Files Requiring Manual Changes
- path/to/file1.ts (reason - not handled by codemod)
- path/to/file2.tsx (reason - not handled by codemod)
...
`

              outputFormat += `
## Phase 4: Manual Changes Applied
- [List of manual fixes made]

## Phase 5: Testing Results
- [ ] Dev server runs
- [ ] Build succeeds
- [ ] No runtime errors

## Next Steps
- [What to do next]`

              outputFormat += "\n```"

              return [
                atom({
                  subject: "format",
                  description: "Expected report format",
                  value: outputFormat,
                }),
              ]
            },
          }),

      atom({
        subject: "start_here",
        description: "Where to begin",
        value: `Begin migration:
1. Start with Phase 1 pre-flight checks
2. Run the codemod in Phase 2 (this handles most changes automatically)
3. Only after codemod completes, analyze and fix remaining issues`,
      }),
    ],
  })

  // Convert to XML format
  const promptText = informationToXml(promptStructure)

  return {
    description: upgradeNextjs16Prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: promptText,
        },
      },
    ],
  }
}
