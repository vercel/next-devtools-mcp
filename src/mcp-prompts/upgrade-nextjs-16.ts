import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const upgradeNextjs16Prompt: Prompt = {
  name: "upgrade-nextjs-16",
  description:
    "Guide through upgrading Next.js to version 16 beta. Runs the official codemod first for automatic fixes, then handles remaining issues manually. Covers async API changes, config moves, image defaults, parallel routes, and deprecations.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (e.g., /path/to/app)",
      required: true,
    },
    {
      name: "mode",
      description: "Mode: 'analyze' (scan only) or 'migrate' (scan + fix)",
      required: false,
    },
  ],
}

export function getUpgradeNextjs16Prompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()
  const mode = args?.mode || "migrate"

  // TEMPORARY: Set to false once Next.js 16 beta supports experimental.cacheComponents
  const REQUIRES_CANARY_FOR_CACHE_COMPONENTS = true

  // Load base Next.js 16 knowledge
  const nextjs16Knowledge = readFileSync(join(__dirname, "nextjs-16.md"), "utf-8")

  return {
    description: upgradeNextjs16Prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a Next.js upgrade assistant. Help upgrade this project from Next.js 15 (or earlier) to Next.js 16.

PROJECT: ${projectPath}
MODE: ${mode === "analyze" ? "ANALYZE ONLY (no changes)" : "MIGRATE (analyze + fix)"}

# BASE KNOWLEDGE: Next.js 16 Technical Reference

<nextjs_16_knowledge>
${nextjs16Knowledge}
</nextjs_16_knowledge>

---

# UPGRADE WORKFLOW: Next.js 15 → 16 Migration Guide

The section below contains the step-by-step upgrade workflow. Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.

## PHASE 1: Pre-Flight Checks (REQUIRED)
────────────────────────────────────────
Check these BEFORE upgrading:

0. **Detect Package Manager**
   Check: package.json "packageManager" field or lock files
   
   **Template Variables:**
   \`\`\`
   npm:   <pkg-manager> = npm        <pkg-exec> = npx
   pnpm:  <pkg-manager> = pnpm       <pkg-exec> = pnpx
   yarn:  <pkg-manager> = yarn       <pkg-exec> = yarn dlx
   bun:   <pkg-manager> = bun        <pkg-exec> = bunx
   \`\`\`
   
   Use these template variables in ALL commands below for consistency

1. **Node.js Version**
   Required: Node.js 20+
   Check: node --version
   Action: Upgrade if < 20

2. **TypeScript Version**
   Required: TypeScript 5.0+
   Check: package.json → devDependencies.typescript
   Action: If exists and < 5.0, upgrade with detected package manager

3. **React and Type Definitions**
   Action: Upgrade React and type definitions using the detected package manager:
   \`\`\`bash
   <pkg-manager> add react@latest react-dom@latest
   <pkg-manager> add -D @types/react@latest @types/react-dom@latest
   \`\`\`

4. **Current Next.js Version**
   Check: package.json → dependencies.next
   Note: Document current version for rollback

## PHASE 2: Run Automated Codemod
────────────────────────────────────────
${mode === "analyze" ? "Skip codemod - Analysis mode only" : "Run the official codemod first to handle most changes automatically:"}

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

**Wait for codemod to complete before proceeding to Phase 3**

${
  REQUIRES_CANARY_FOR_CACHE_COMPONENTS
    ? `
**⚠️ TEMPORARY: Upgrade to Canary (Required for cacheComponents)**

The beta version doesn't support \`experimental.cacheComponents\` yet. If your project uses \`'use cache'\` directives or needs cacheComponents, upgrade to canary:

\`\`\`bash
<pkg-manager> add next@canary
<pkg-manager> add -D eslint-config-next@canary
\`\`\`
`
    : ""
}

## PHASE 3: Analyze Remaining Issues
────────────────────────────────────────
After the codemod runs, check for any remaining issues it might have missed:

### Manual Check Checklist:

**A. Parallel Routes (NOT handled by codemod)**
   Files: Check for @ folders
   Requirement: All parallel route slots must have \`default.js\` files
   Impact: Build fails without them
   
   Fix if missing:
   \`\`\`typescript
   // Create: app/@modal/default.js
   export default function Default() {
     return null
   }
   \`\`\`

**B. Image Security Config (NOT handled by codemod)**
   File: next.config.js
   Check: Are you using local images with query strings?
   
   If yes, add:
   \`\`\`diff
   + images: {
   +   localPatterns: [{ pathname: '/img/**' }]
   + }
   \`\`\`

**C. Image Default Changes (Behavior change)**
   Note: These defaults changed automatically in v16:
   - \`minimumCacheTTL\`: 60s -> 14400s (4 hours)
   - \`qualities\`: [1..100] -> [75]
   - \`imageSizes\`: removed 16
   - \`dangerouslyAllowLocalIP\`: now false by default
   - \`maximumRedirects\`: unlimited -> 3
   
   Action: Review if these affect your app, override in config if needed

**D. Lint Command Migration (NOT handled by codemod)**
   Files: package.json scripts, CI workflows
   Check: Scripts using \`next lint\`
   Note: \`next build\` no longer runs linting automatically
   
   Options:
   1. Use Biome: \`biome check .\`
   2. Use ESLint directly: \`<pkg-exec> @next/codemod@canary next-lint-to-eslint-cli .\`

**E. --turbopack Flags (No Longer Needed)**
   Files: package.json scripts
   Check: \`next dev --turbopack\`, \`next build --turbopack\`
   Action: Remove \`--turbopack\` flags (Turbopack is default in v16)
   Note: Use \`--webpack\` flag if you want webpack instead

**F. Edge Cases the Codemod May Miss**
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
   - Any function that doesn't use the 5 APIs above

**G. ViewTransition API Renamed (NOT handled by codemod)**
   Files: Search for imports of \`unstable_ViewTransition\` from React
   Action: Rename to \`ViewTransition\` (now stable in v16)

   \`\`\`diff
   - import { unstable_ViewTransition } from 'react'
   + import { ViewTransition } from 'react'
   \`\`\`

**H. revalidateTag API Changes (Deprecation - NOT handled by codemod)**
   Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.

**I. Deprecated Features (WARNINGS - Optional)**
   - \`middleware.ts\` → consider renaming to \`proxy.ts\`
   - \`next/legacy/image\` → use \`next/image\`
   - \`images.domains\` → use \`images.remotePatterns\`
   - \`unstable_rootParams()\` → being replaced

## PHASE 4: Apply Manual Fixes
────────────────────────────────────────
${mode === "analyze" ? "List what needs manual fixes" : "Only fix issues the codemod missed:"}

Based on Phase 3 analysis, apply only the necessary manual fixes:

**1. Fix experimental flags consolidation (if ppr or useCache found)**
   Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.
   - Replace \`experimental.ppr\` with \`cacheComponents: true\`
   - Replace \`experimental.useCache\` with \`cacheComponents: true\`

**2. Add missing default.js files (if you have @ folders)**

**3. Add image security config (if using local images with query strings)**

**4. Update lint commands (if using next lint in scripts/CI)**

**5. Fix revalidateTag calls (if compilation errors occur)**
   - Add profile parameter: \`revalidateTag(tag, 'max')\`
   - Or use \`unstable_updateTag\` for read-your-own-writes in Server Actions

**6. Fix edge cases the codemod missed (RARE - only if found in Phase 3)**
   Template for async API fixes:
   \`\`\`diff
   - export default function Page({ params, searchParams }) {
   -   const slug = params.slug
   + export default async function Page(props) {
   +   const params = await props.params
   +   const searchParams = await props.searchParams
   +   const slug = params.slug
   \`\`\`

## PHASE 5: Test & Verify
────────────────────────────────────────
${mode === "analyze" ? "Plan testing strategy" : "Run tests:"}

1. **Dev Server**
   \`\`\`bash
   __NEXT_EXPERIMENTAL_MCP_SERVER=true <pkg-manager> dev
   # Check for warnings/errors in console
   \`\`\`

2. **Build**
   \`\`\`bash
   <pkg-manager> run build
   # Should succeed without errors
   \`\`\`

3. **Production Test**
   \`\`\`bash
   <pkg-manager> start
   # Test all routes
   \`\`\`

4. **Check for Warnings**
   - Image component deprecation warnings
   - Runtime API warnings
   - Any other console warnings

## OUTPUT FORMAT
────────────────────────────────────────
Report findings in this format:

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

${
  mode === "migrate"
    ? `## Phase 2: Codemod Execution
- [ ] Ran codemod: \`<pkg-exec> @next/codemod@canary upgrade beta\`
${REQUIRES_CANARY_FOR_CACHE_COMPONENTS ? "- [ ] Upgraded to canary: `<pkg-manager> add next@canary`\n- [ ] Upgraded eslint-config-next: `<pkg-manager> add -D eslint-config-next@canary`\n" : ""}- [ ] Dependencies upgraded
- [ ] Automatic fixes applied
`
    : ""
}

## Phase 3: Issues Requiring Manual Fixes
${mode === "analyze" ? "Issues that will need manual fixes after running codemod:" : "Issues the codemod couldn't handle:"}
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

${mode === "migrate" ? "## Phase 4: Manual Changes Applied\n- [List of manual fixes made]\n\n## Phase 5: Testing Results\n- [ ] Dev server runs\n- [ ] Build succeeds\n- [ ] No runtime errors\n\n## Next Steps\n- [What to do next]" : ""}
\`\`\`

# START HERE
${mode === "analyze" ? "Begin analysis of the project. DO NOT modify any files. Focus on what will need attention AFTER the codemod runs." : "Begin migration:\n1. Start with Phase 1 pre-flight checks\n2. Run the codemod in Phase 2 (this handles most changes automatically)\n3. Only after codemod completes, analyze and fix remaining issues"}`,
        },
      },
    ],
  }
}
