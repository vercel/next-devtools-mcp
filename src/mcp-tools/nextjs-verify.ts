import { tool } from "ai"
import { z } from "zod"

// Next.js Verification Tool
const nextjsVerifyInputSchema = z.object({
  project_path: z.string().describe("Path to the Next.js project to verify"),
  verification_type: z
    .enum(["build", "dev-check", "interactive"])
    .optional()
    .default("interactive")
    .describe(
      "Type of verification: 'build' (simple build test), 'dev-check' (check errors via MCP), 'interactive' (ask user what to verify)"
    ),
  routes_to_test: z
    .array(z.string())
    .optional()
    .describe("Optional list of routes to test (e.g., ['/'], ['/blog', '/about'])"),
})

export const nextjsVerifyTool = tool({
  description: `Verify Next.js project after upgrade or changes.
Provides flexible verification options: simple build test, dev server error checking via Next.js MCP, or interactive mode.
Use after upgrading Next.js or making significant changes to verify everything works.`,
  inputSchema: nextjsVerifyInputSchema,
  execute: async ({
    project_path,
    verification_type = "interactive",
    routes_to_test = [],
  }: z.infer<typeof nextjsVerifyInputSchema>): Promise<string> => {
    return `# Next.js Verification Guide

**Project:** ${project_path}
**Verification Type:** ${verification_type}

## Verification Options

Choose how you want to verify the Next.js project:

### Option 1: Simple Build Test
**Best for:** Quick check that project compiles
**Time:** 1-2 minutes

\`\`\`bash
cd ${project_path}
pnpm build
\`\`\`

**What it checks:**
- [+] TypeScript compilation
- [+] All pages build successfully
- [+] No build-time errors

**Success:** Build completes without errors
**Failure:** Build fails with error messages

---

### Option 2: Dev Server Error Check (RECOMMENDED)
**Best for:** Catching errors BEFORE build time
**Time:** 5-10 minutes
**Requires:** Next.js MCP server

**IMPORTANT:** Pages can return 200 (load successfully) but still have errors that will break the build.
Using Next.js MCP \`get_errors\` in dev catches these issues EARLY, saving time.

**Step 1: Start Dev Server with MCP**

**IMPORTANT:** Start dev server in background or separate terminal to avoid blocking:
\`\`\`bash
cd ${project_path}
__NEXT_EXPERIMENTAL_MCP_SERVER=true <pkg-manager> next dev
\`\`\`

**To stop dev server later:**
- User can press Ctrl+C in dev server terminal when done
- AI agent should NEVER kill shells or processes
- AI agent should NEVER use kill, lsof, or process termination
- Let user manage process lifecycle

**Step 2: Check MCP Connection**
\`\`\`bash
# In another terminal
curl http://localhost:3000/_next/mcp
\`\`\`

If MCP server responds, you can use Next.js MCP tools.

**Step 3: Use Next.js MCP \`get_errors\` Tool**

**CRITICAL:** Always check \`get_errors\` even if pages load (200 status).
Pages can load but still have TypeScript errors, React errors, or deprecation warnings.

1. **Initial error check:**
   - Use Next.js MCP tool: \`get_errors\`
   - Shows ALL errors in the project (even if pages load)

2. **Test each route and check errors:**
   ${routes_to_test.length > 0 ? `Routes to test: ${routes_to_test.join(", ")}` : "- / (homepage)\n   - /blog (if exists)\n   - /about (if exists)\n   - Any dynamic routes"}
   
   **For EACH route:**
   a. Ask user to open in browser: http://localhost:3000/route
      (AI agent cannot open browser directly - user must do this)
   b. After user opens route, use Next.js MCP \`get_errors\` tool
   c. Review errors with user and fix any found BEFORE moving to next route
   d. Use \`get_logs\` to check for warnings

3. **Why this is important:**
   - ✅ Catches TypeScript errors that won't block page load in dev
   - ✅ Finds async/await issues that will break in build
   - ✅ Identifies deprecation warnings before they become errors
   - ✅ Saves time vs waiting for build to fail

**What it checks:**
- [+] TypeScript errors (even if page loads)
- [+] React errors and warnings
- [+] Server-side rendering issues
- [+] Async API usage errors
- [+] Deprecation warnings
- [+] API routes functionality

**Fix errors in dev, not during build - it's much faster!**

---

### Option 3: Comprehensive Verification
**Best for:** Full confidence before deployment
**Time:** 10-15 minutes

**Phase 1: Build Test**
\`\`\`bash
cd ${project_path}
pnpm build
\`\`\`

**Phase 2: Production Test**
\`\`\`bash
pnpm start
# Visit http://localhost:3000
# Test critical routes
\`\`\`

**Phase 3: Dev Server with MCP**
\`\`\`bash
# Stop production server first (Ctrl+C in its terminal)
__NEXT_EXPERIMENTAL_MCP_SERVER=true <pkg-manager> next dev
\`\`\`

**To manage dev server:**
- User stops: Press Ctrl+C in the terminal running dev server
- AI agent: NEVER kill shells or use process termination commands
- Let user control when to stop the server

**Phase 4: Interactive Testing**
1. Connect to Next.js MCP server
2. Use \`get_errors\` tool to check for errors
3. Use \`get_logs\` tool to check logs
4. Test these routes manually:
   ${routes_to_test.length > 0 ? routes_to_test.map((r) => `- ${r}`).join("\n   ") : "- / (homepage)\n   - /blog (if exists)\n   - /about (if exists)\n   - Any dynamic routes"}
5. Check browser console on each page
6. After each route, use Next.js MCP \`get_errors\` again

**What it checks:**
- [+] Build succeeds
- [+] Production mode works
- [+] Development mode works
- [+] No runtime errors
- [+] All routes accessible
- [+] No console errors

---

## Interactive Mode (Recommended)

${verification_type === "interactive" ? "**You selected interactive mode.**" : ""}

Let's determine what verification you need:

**Questions to guide your choice:**

1. **Did you just upgrade Next.js?**
   - Yes - Recommend: **Comprehensive Verification**
   - No - Recommend: **Simple Build Test**

2. **Do you have a Next.js MCP server configured?**
   - Yes - You can use **Dev Server Error Check**
   - No - Use **Simple Build Test** or set up MCP first

3. **Is this a critical production app?**
   - Yes - Definitely do **Comprehensive Verification**
   - No - **Build Test** might be enough

4. **Are there specific routes you're concerned about?**
   ${routes_to_test.length > 0 ? `- You specified: ${routes_to_test.join(", ")}` : "- If yes, use **Dev Server Error Check** and test those routes"}

5. **How much time do you have?**
   - 1-2 min - **Simple Build Test**
   - 5-10 min - **Dev Server Error Check**
   - 10-15 min - **Comprehensive Verification**

---

## Using Next.js MCP Tools (if available)

If you have Next.js MCP server running, you can use these tools:

### Tool: get_errors
**Purpose:** Get all current errors in the Next.js app
**When to use:** After starting dev server, after navigating to routes

### Tool: get_logs  
**Purpose:** Get server logs and warnings
**When to use:** To check for warnings, deprecation notices, or issues

### Example Workflow:
\`\`\`
1. Start dev server with MCP
2. Use get_errors - Check for initial errors (BEFORE opening any pages)
3. Fix any errors found
4. Ask user to open: http://localhost:3000/ in their browser
5. Use get_errors - Check if page introduced new errors (page may load but have errors!)
6. Fix errors if found
7. Ask user to open: http://localhost:3000/blog
8. Use get_errors - Check again (even if page loads successfully)
9. Fix errors if found
10. Repeat for all critical routes

**Key points:**
- AI agent asks user to open routes (cannot open browser automatically)
- Don't skip get_errors just because page loads
- A 200 response doesn't mean no errors - TypeScript/React errors may still exist!
- For automated testing, use chrome_devtools tool
\`\`\`

---

## Verification Results Format

**CRITICAL: Use diff code blocks with - and + prefixes**

**Every diff line MUST have - or + prefix. NO lines without them.**

### Example Format:

Use diff syntax for all code changes:

app/blog/[slug]/page.tsx:15
  Issue: Sync params usage
- export default function Page({ params }) {
+ export default async function Page(props) {
+   const params = await props.params

app/api/route.ts:23
  Issue: cookies() not awaited
- const cookieStore = cookies()
+ const cookieStore = await cookies()

next.config.js:3
  Issue: experimental.turbopack moved to top-level
- experimental: { turbopack: {...} }
+ turbopack: { ... }

**RULES:**
1. Use diff syntax in code blocks
2. EVERY code line has - or + prefix
3. NO unprefixed code lines in diffs

### For Build Errors:
\`\`\`
Build Error:
  File: app/components/Nav.tsx:42
  Error: Type 'Promise<Params>' is not assignable to type 'Params'
  Fix: Add await to params access
\`\`\`

**Do NOT show entire file contents.** Only show:
- Filename and line numbers
- Specific lines that need changes
- Concise before/after diff

## Common Issues to Check For

After Next.js 16 upgrade:

- [x] **Async API errors:** "params is not defined" - Need to await props.params
- [x] **Config errors:** "experimental.turbopack not recognized" - Move to top-level turbopack
- [x] **Image errors:** "Local pattern required" - Add images.localPatterns for query strings
- [x] **Parallel route errors:** "default.js not found" - Add default.js to @ folders
- [x] **Type errors:** "@types/react version mismatch" - Update types if they exist

---

## Recommended Verification for Your Case

${
  verification_type === "build"
    ? `**Simple Build Test Selected**

Run this now:
\`\`\`bash
cd ${project_path}
pnpm build
\`\`\`

If build succeeds: [OK] Basic verification passed
If build fails: Review errors and fix before proceeding`
    : verification_type === "dev-check"
      ? `**Dev Server Error Check Selected**

Run these commands:
\`\`\`bash
cd ${project_path}
__NEXT_EXPERIMENTAL_MCP_SERVER=true pnpm next dev
\`\`\`

Then use Next.js MCP tools:
1. get_errors - Check for errors
2. get_logs - Check logs
3. Test routes: ${routes_to_test.length > 0 ? routes_to_test.join(", ") : "Visit critical routes"}
4. get_errors again after each route`
      : `**Interactive Mode**

Based on your situation, choose one of the options above.

Quick recommendation:
- Just upgraded? - Use **Dev Server Error Check** (catches issues early, saves build time)
- Making small changes? - **Simple Build Test** might be enough
- Pre-deployment? - Do **Comprehensive Verification**

**Pro tip:** Always use get_errors in dev mode after Next.js 16 upgrade.
Pages can load (200) but still have errors that will break the build later.`
}

---

## Next Steps

1. Choose your verification type from options above
2. Run the recommended commands
3. If errors found, fix them and re-verify
4. Once verification passes, you're ready to deploy!

**Note:** For the most thorough verification, use Next.js MCP tools if available.
They provide real-time error checking and detailed logs.`
  },
})
