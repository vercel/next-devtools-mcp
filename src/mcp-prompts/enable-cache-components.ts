import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const enableCacheComponentsPrompt: Prompt = {
  name: "enable-cache-components",
  description:
    "Enable and verify Cache Components in Next.js 16. Configures experimental.cacheComponents, starts dev server with MCP enabled, verifies all routes, and fixes any errors automatically.",
  arguments: [
    {
      name: "project_path",
      description: "Path to the Next.js project (e.g., /path/to/app)",
      required: true,
    },
    {
      name: "mode",
      description: "Mode: 'enable' (configure + verify) or 'verify-only' (check existing setup)",
      required: false,
    },
  ],
}

export function getEnableCacheComponentsPrompt(args?: Record<string, string>): GetPromptResult {
  const projectPath = args?.project_path || process.cwd()
  const mode = args?.mode || "enable"

  // Load base Next.js 16 knowledge
  const nextjs16Knowledge = readFileSync(join(__dirname, "nextjs-16.md"), "utf-8")

  return {
    description: enableCacheComponentsPrompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a Next.js Cache Components setup assistant. Help enable and verify Cache Components in this Next.js 16 project.

PROJECT: ${projectPath}
MODE: ${mode === "verify-only" ? "VERIFY ONLY (check existing setup)" : "ENABLE (configure + verify)"}

# BASE KNOWLEDGE: Next.js 16 Technical Reference

<nextjs_16_knowledge>
${nextjs16Knowledge}
</nextjs_16_knowledge>

---

# ENABLE WORKFLOW: Cache Components Setup & Verification Guide

The section below contains the step-by-step enablement workflow. Refer to the base knowledge above for detailed technical behavior, API semantics, and best practices.

## Decision Guide: Suspense vs "use cache"

When fixing blocking route errors, choose the right approach:

**Use Suspense When:**
- Content is truly per-request dynamic (user-specific data, auth state, real-time data)
- Content depends on request cookies, headers, or user session
- Content changes frequently and shouldn't be cached
- You want to show a loading skeleton while fetching
- Examples: User dashboard, shopping cart, notifications, personalized feeds

**Use "use cache" When:**
- Content can be shared across multiple users/requests
- Content is relatively stable (CMS data, blog posts, product listings)
- Content is expensive to compute/fetch but doesn't change often
- You want instant navigation without loading states
- Examples: Blog posts, product catalogs, site settings, marketing pages

**Use Both (Mix) When:**
- Page has both shared and personalized content
- Static header/footer with dynamic user sections
- Cached product list with dynamic "Add to Cart" buttons
- Examples: E-commerce product pages, content with personalized recommendations

**Special Cases:**
- \`"use cache: private"\` - For content that uses cookies/params but can still be prefetched
- \`"use cache: remote"\` - For serverless/Vercel to persist cache across requests
- Suspense around \`<body>\` - Most permissive, traditional SSR behavior (no static shell)

## PHASE 1: Pre-Flight Checks
────────────────────────────────────────
Before enabling Cache Components:

1. **Detect Package Manager**
   Check: package.json "packageManager" field or lock files
   
   **Template Variables:**
   \`\`\`
   npm:   <pkg-manager> = npm        <pkg-exec> = npx
   pnpm:  <pkg-manager> = pnpm       <pkg-exec> = pnpx
   yarn:  <pkg-manager> = yarn       <pkg-exec> = yarn dlx
   bun:   <pkg-manager> = bun        <pkg-exec> = bunx
   \`\`\`

2. **Next.js Version Check**
   Required: Next.js 16.0.0 or later
   Check: package.json → dependencies.next
   Action: If < 16.0.0, run upgrade-nextjs-16 prompt first

3. **Existing Configuration Check**
   Read: next.config.js or next.config.ts
   Look for:
   - \`experimental.cacheComponents\` (new name)
   - \`experimental.dynamicIO\` (old name - needs migration)
   - \`experimental.ppr\` (removed - incompatible with Next.js 16)
   
   If \`experimental.ppr\` exists:
   ⚠️  WARNING: The \`experimental.ppr\` flag has been removed in Next.js 16
   ⚠️  You must migrate to \`experimental.cacheComponents\` instead
   ⚠️  Note: There are implementation differences - review your PPR usage

4. **Route Structure Analysis**
   Scan: app directory structure
   Identify: All routes (page.tsx/page.js files)
   Note: List all routes for Phase 3 verification

5. **Existing Route Segment Config Check**
   Search for: \`export const dynamic\`, \`export const revalidate\`, \`export const fetchCache\`
   ⚠️  WARNING: Route Segment Config options are DISABLED with Cache Components
   Action: Document these for migration - will need to be replaced with \`"use cache"\` + \`cacheLife\`

## PHASE 2: Enable Cache Components Configuration
────────────────────────────────────────
${mode === "verify-only" ? "Skip configuration - Verification mode only" : "Update the Next.js configuration to enable Cache Components:"}

${
  mode === "enable"
    ? `**Step 1: Backup existing config**
Copy current next.config.js or next.config.ts before making changes

**Step 2: Update configuration**

Option A - If starting fresh (no existing experimental.cacheComponents):
\`\`\`typescript
// next.config.ts (or .js)
const nextConfig = {
  experimental: {
    cacheComponents: true,
  },
}

export default nextConfig
\`\`\`

Option B - If migrating from experimental.dynamicIO:
\`\`\`diff
  const nextConfig = {
    experimental: {
-     dynamicIO: true,
+     cacheComponents: true,
    },
  }
\`\`\`

Option C - If migrating from experimental.ppr:
\`\`\`diff
  const nextConfig = {
    experimental: {
-     ppr: true,
+     cacheComponents: true,
    },
  }
\`\`\`

⚠️  **Important for PPR Migration:**
If you were using \`experimental.ppr\`, note that Cache Components has:
- Different implementation details
- Additional features and behaviors
- May require code adjustments in your routes
- Review route-level cache behavior after migration

**Step 3: Consider cacheLife profiles**
If you're using \`revalidateTag()\`, update to the new signature:
\`\`\`typescript
import { revalidateTag } from 'next/cache'

// Old (deprecated)
revalidateTag('my-tag')

// New (with cacheLife profile)
revalidateTag('my-tag', 'max')  // Recommended for most cases
\`\`\`

Built-in cacheLife profiles:
- \`'max'\` - Long-lived content with background revalidation (recommended)
- \`'hours'\` - Content that changes every few hours
- \`'days'\` - Content that changes daily or less frequently
`
    : ""
}

## PHASE 3: Start Dev Server with MCP
────────────────────────────────────────

**IMPORTANT: Only start the dev server ONCE. Do NOT restart it during this process.**

### Step 1: Check for Existing Server or Stale Locks

Before starting, check if there's already a dev server or stale lock files:

\`\`\`bash
# Check if Next.js dev server is already running
lsof -ti:3000 || echo "Port 3000 is free"
\`\`\`

**If a server is already running:**
- Check if it has MCP enabled (look for "__NEXT_EXPERIMENTAL_MCP_SERVER" in process env)
- If yes: Use the existing server, proceed to Phase 4
- If no: Stop it first, then start with MCP enabled

**If you see stale lock files from previous sessions:**
\`\`\`bash
# Only run this if there's no active dev server but lock file exists
rm -rf .next/dev/lock
\`\`\`

### Step 2: Start Dev Server (ONE TIME ONLY)

\`\`\`bash
# Start dev server in background with MCP enabled
__NEXT_EXPERIMENTAL_MCP_SERVER=true <pkg-manager> dev
\`\`\`

**This command:**
- Runs in the background
- Should only be executed ONCE
- Will continue running throughout Phase 4 and Phase 5
- Should NOT be restarted unless it crashes

### Step 3: Wait for Server to Start

\`\`\`bash
# Wait 10-15 seconds for server to initialize
sleep 10
\`\`\`

### Step 4: Verify Server is Running and Capture URL

Check the server output for:
- ✅ "Ready started server on [URL]" or "Local: http://localhost:[PORT]"
- ✅ No fatal errors
- ✅ Port number (usually 3000, might be 3001 if 3000 is in use)
- ✅ MCP server started message (if available)

**IMPORTANT: Memorize the URL and Port**

From the dev server output, capture:
- Base URL: e.g., \`http://localhost:3000\` or \`http://localhost:3001\`
- Port number: e.g., \`3000\` or \`3001\`

**You will need these for:**
- Step 5: Connecting to MCP server at \`<url>:<port>/_next/mcp\`
- Phase 4: Making HTTP requests to routes at \`<url>:<port>/[route-path]\`

**If you see errors:**

**Lock File Error:** "Unable to acquire lock at .next/dev/lock"
- This means another Next.js instance is running OR a stale lock exists
- **DO NOT start the server again**
- Either use the existing server or clean up properly first

**Port In Use Error:** "Port 3000 is in use"
- Next.js will automatically use next available port (3001, 3002, etc.)
- This is NORMAL, note the actual port being used
- **DO NOT restart the server**

### Step 5: Verify MCP Server is Active

**Connect to Next.js MCP Server:**

The Next.js MCP server is available at: **\`<url>:<port>/_next/mcp\`**

Using the URL and port from Step 4:
- If dev server is at \`http://localhost:3000\`
- Then MCP server is at \`http://localhost:3000/_next/mcp\`

Try to connect to the Next.js MCP server and check if it's responding:

\`\`\`
Connect to MCP server at <url>:<port>/_next/mcp
Call the get_project_metadata tool
\`\`\`

**Example:**
If your dev server started on port 3001 (because 3000 was in use):
- Dev server: \`http://localhost:3001\`
- MCP endpoint: \`http://localhost:3001/_next/mcp\`
- Connect to this endpoint and call \`get_project_metadata\`

**Expected Result:**
- ✅ Successfully connects to \`<url>:<port>/_next/mcp\`
- ✅ Tool responds successfully with project metadata:
  - Project name and version
  - Next.js version
  - Configuration (including experimental.cacheComponents status)
  - Installed dependencies
- This confirms the MCP server is alive and ready for error detection
- You should see \`cacheComponents: true\` in the config if Phase 2 was successful

**If the tool is not available or connection fails:**

First attempt troubleshooting (DO NOT restart the server):
1. Wait another 10 seconds - MCP server may still be initializing
2. Retry calling \`get_project_metadata\`
3. Check dev server output for:
   - "MCP server started" or similar message
   - Any MCP-related errors
4. Verify __NEXT_EXPERIMENTAL_MCP_SERVER=true was set in the environment

If still failing after retry:
- Check if dev server is actually running (port should be occupied)
- Look for error messages in dev server output
- Verify the Next.js version supports MCP (16.0.0+)
- **LAST RESORT ONLY:** If dev server crashed, then you can restart it
- **DO NOT restart if server is running** - troubleshoot the MCP connection first

**Why this check matters:**
- Phase 4 relies heavily on the \`get_errors\` tool from Next.js MCP server
- Without MCP, you won't be able to detect Cache Components errors
- \`get_project_metadata\` is the simplest tool to verify MCP is alive
- Better to verify now than discover MCP is broken during route verification

### Step 6: Record Server Details

**Critical Information for Phase 4 and 5:**

Record these details from the dev server output:
- **Base URL**: [e.g., http://localhost:3000 or http://localhost:3001]
- **MCP Endpoint**: [e.g., http://localhost:3000/_next/mcp]
- **All route paths**: [list from Phase 1, e.g., /, /about, /blog, /blog/[slug]]

**Usage:**
- Base URL for HTTP requests: \`<base-url>/about\`
- MCP Endpoint for error detection: Connect to \`<mcp-endpoint>\` and call \`get_errors\`

**Server State:**
- ✅ Server is running in background
- ✅ MCP server is active and verified
- ⚠️  Do NOT stop or restart the server until Phase 6 is complete

## PHASE 4: Route Verification & Error Detection
────────────────────────────────────────

**CRITICAL: You MUST use chrome_devtools tool to load pages in browser**

Next.js MCP's \`get_errors\` tool collects errors from the Chrome browser session.
Without using the chrome_devtools tool to navigate pages, \`get_errors\` will have no
errors to collect.

**Prerequisites:**
- ✅ Dev server is running from Phase 3 (do NOT restart it)
- ✅ Base URL is captured from Step 4 (e.g., http://localhost:3000)
- ✅ MCP Endpoint is known (e.g., http://localhost:3000/_next/mcp)
- ✅ MCP server is verified active (get_project_metadata responded)
- ✅ List of all routes from Phase 1
- ✅ chrome_devtools tool is available

**Workflow per route:**
1. Use chrome_devtools tool with action "navigate" to load the page in browser
2. Use Next.js MCP get_errors to collect errors from that chrome session
3. Categorize and record errors
4. Move to next route

Systematically verify each route and collect errors:

**For Each Route:**

1. **Navigate to Page in Browser (REQUIRED)**
   **Tool:** chrome_devtools
   **Action:** navigate
   **URL:** \`<base-url><route-path>\`

   **Example:**
   - Base URL from Step 4: \`http://localhost:3001\` (port 3001 if 3000 was in use)
   - Route path: \`/dashboard\`
   - Full URL: \`http://localhost:3001/dashboard\`
   - Tool call: chrome_devtools({ action: "navigate", url: "http://localhost:3001/dashboard" })

   This loads the page in Chrome and triggers any rendering errors.
   Expected: Page loads successfully (or errors are captured by Next.js MCP)

2. **Collect Errors from Chrome Session (using Next.js MCP)**
   **Connect to MCP Endpoint:** \`<base-url>/_next/mcp\`
   **Tool:** \`get_errors\` from Next.js MCP server

   **Example:**
   - MCP Endpoint: \`http://localhost:3001/_next/mcp\`
   - Connect to this endpoint
   - Call \`get_errors\` tool with no arguments

   The \`get_errors\` tool reads errors from the chrome session you
   just created in step 1.

   Record:
   - Error messages
   - Stack traces
   - Affected route/component
   - Error type (build, runtime, render, etc.)

3. **Categorize Errors**
   Common Cache Components errors:
   
   a) **Blocking Route Error (Most Common)**
      Error message: "Route "/path": A component accessed data, headers, params, searchParams, or a short-lived cache without a Suspense boundary nor a \\"use cache\\" above it."
      
      Cause: Async IO outside Suspense boundary or "use cache"
      Async IO includes:
      - \`await fetch()\` - network requests
      - \`await db.query()\` - database calls
      - \`await params\` - route params
      - \`await searchParams\` - query params
      - \`await cookies()\` - request cookies
      - \`await headers()\` - request headers
      - \`await somePromise\` - any long-running promise
      
      Fix Options:
      1. Add parent Suspense boundary (preferred for truly dynamic content)
      2. Add \`"use cache"\` directive to component (for cacheable content)
      3. Use \`loading.tsx\` file convention (simplest for page-level)
   
   b) **Dynamic Value in Static Shell Error**
      Error message: "Dynamic value detected during prerender"
      
      Cause: Using sync dynamic APIs without marking as dynamic:
      - \`Math.random()\`
      - \`new Date()\`
      - Other time/randomness APIs
      
      Fix Options:
      1. Add \`await connection()\` before the dynamic API usage
      2. Add \`"use cache"\` to prerender these values
   
   c) **Route Params Without generateStaticParams**
      Error: Blocking route error when using \`"use cache"\` with dynamic params
      
      Cause: Using \`await params\` inside \`"use cache"\` without static params list
      
      Fix: Add \`generateStaticParams\` to provide known params at build time
   
   d) **Unavailable APIs in "use cache"**
      Error: "Cannot use [API] inside a cached function"
      
      APIs not available in \`"use cache"\`:
      - \`cookies()\` (use \`"use cache: private"\` for prefetch-time access)
      - \`headers()\` (use \`"use cache: private"\` for prefetch-time access)
      - \`searchParams\` (use \`"use cache: private"\` for prefetch-time access)
      
      Fix: Either remove from cache scope or use \`"use cache: private"\`
   
   e) **Route Segment Config Conflicts**
      Error: "Route Segment Config is not supported with Cache Components"
      
      Cause: Using \`export const dynamic\`, \`export const revalidate\`, etc.
      
      Fix: Remove Route Segment Config, use \`"use cache"\` + \`cacheLife\` instead

4. **Error Collection Format**
   For each error found, record:
   \`\`\`
   Route: [route-path]
   Error Type: [category from step 3]
   Message: [full error message]
   Stack: [stack trace if available]
   File: [affected file path]
   Line: [line number if available]
   \`\`\`

**Automation Strategy:**
- Use the Base URL captured in Step 6 for all chrome_devtools navigation
- Use the MCP Endpoint captured in Step 6 for all get_errors calls
- Iterate through ALL routes from Phase 1
- For each route:
  1. Navigate with chrome_devtools({ action: "navigate", url: "..." })
  2. Connect to Next.js MCP endpoint
  3. Call get_errors to collect from chrome session
  4. Record errors
  5. Move to next route
- Build comprehensive error list before fixing
- Prioritize errors by severity (build failures > runtime errors > warnings)

**Important:**
- ALWAYS use chrome_devtools with action "navigate" before calling get_errors
- Always connect to the SAME Next.js MCP endpoint (\`<base-url>/_next/mcp\`)
- Do NOT try to reconnect or restart the MCP server
- If chrome_devtools navigation fails, check if Chrome is installed
- If Next.js MCP connection fails, the dev server may have crashed (rare)

## PHASE 5: Automated Error Fixing
────────────────────────────────────────

**Prerequisites:**
- ✅ Dev server is still running from Phase 3 (do NOT restart it)
- ✅ Error list collected from Phase 4
- ✅ Fast Refresh will apply changes automatically

Fix errors systematically based on error type:

**A. Fixing Blocking Route Errors - Option 1: Add Suspense Boundary**

Best for: Truly dynamic, per-request content (user data, real-time info)

\`\`\`diff
// Option 1a: Add Suspense in the page
export default async function Page() {
  return (
+   <Suspense fallback={<Skeleton />}>
      <DynamicContent />
+   </Suspense>
  );
}

async function DynamicContent() {
  const res = await fetch('http://api.example.com/data');
  const data = await res.json();
  return <div>{data.title}</div>;
}
\`\`\`

\`\`\`diff
// Option 1b: Add Suspense in layout (applies to all child routes)
export default function Layout({ children }) {
  return (
+   <Suspense fallback={<Loading />}>
      {children}
+   </Suspense>
  );
}
\`\`\`

\`\`\`typescript
// Option 1c: Use loading.tsx file (simplest for page-level)
// Create: app/[route]/loading.tsx
export default function Loading() {
  return <Skeleton />;
}
\`\`\`

**B. Fixing Blocking Route Errors - Option 2: Add "use cache"**

Best for: Content that can be cached and reused across requests

\`\`\`diff
export default async function Page() {
+ "use cache";
+ 
  const res = await fetch('http://api.cms.com/posts');
  const { posts } = await res.json();
  
  return <div>{/* render posts */}</div>;
}
\`\`\`

\`\`\`typescript
// Can also cache individual functions
export async function getPosts() {
  "use cache";
  
  const res = await fetch('http://api.cms.com/posts');
  return res.json();
}

export default async function Page() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
\`\`\`

\`\`\`diff
// Mix cached and dynamic content
export default async function Page() {
  return (
    <div>
      <CachedHeader />     {/* Has "use cache" */}
      <Suspense>
        <DynamicContent /> {/* Truly dynamic */}
      </Suspense>
    </div>
  );
}

async function CachedHeader() {
+ "use cache";
  const settings = await fetch('http://api.cms.com/settings');
  return <header>{/* ... */}</header>;
}
\`\`\`

**C. Fixing Dynamic Value in Static Shell**

\`\`\`diff
+ import { connection } from 'next/server';

async function Component() {
+ await connection();
  const random = Math.random();
  const now = new Date();
  
  // These dynamic values now execute at request time
}
\`\`\`

**D. Fixing Route Params with "use cache"**

\`\`\`diff
+ export async function generateStaticParams() {
+   // Provide known params at build time
+   const posts = await fetch('http://api.cms.com/posts').then(r => r.json());
+   return posts.map(post => ({ slug: post.slug }));
+ }

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  "use cache";
  
  const { slug } = await params;
  const post = await fetch(\`http://api.cms.com/posts/\${slug}\`).then(r => r.json());
  
  return <div>{post.title}</div>;
}
\`\`\`

**E. Fixing Unavailable APIs in "use cache"**

\`\`\`diff
// Option 1: Move dynamic API outside cache scope
export default async function Page() {
+ const cookieStore = await cookies();
+ const userId = cookieStore.get('userId');
+
  return (
    <div>
-     <CachedContent />
+     <CachedContent userId={userId} />
    </div>
  );
}

- async function CachedContent() {
+ async function CachedContent({ userId }: { userId: string }) {
  "use cache";
-  const cookieStore = await cookies();
-  const userId = cookieStore.get('userId');
  
  const userData = await fetch(\`http://api.example.com/users/\${userId}\`);
  return <div>{/* ... */}</div>;
}
\`\`\`

\`\`\`diff
// Option 2: Use "use cache: private" for runtime prefetching
export default async function Page() {
- "use cache";
+ "use cache: private";
+ 
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');
  
  // This can now be prefetched with actual cookie values
  return <div>{/* ... */}</div>;
}
\`\`\`

**F. Fixing Route Segment Config Conflicts**

\`\`\`diff
- export const dynamic = 'force-static';
- export const revalidate = 3600;

export default async function Page() {
+ "use cache";
+ 
+ import { unstable_cacheLife as cacheLife } from 'next/cache';
+ cacheLife({
+   revalidate: 3600,
+   expire: Infinity,
+ });
  
  const data = await fetch('http://api.example.com/data');
  return <div>{/* ... */}</div>;
}
\`\`\`

**G. Adding cacheLife Profiles**

\`\`\`typescript
import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function Page() {
  "use cache";
  
  cacheLife({
    revalidate: 900,    // 15 minutes - revalidate in background
    expire: 3600,       // 1 hour - block on revalidation after this
  });
  
  const data = await fetch('http://api.example.com/data');
  return <div>{/* ... */}</div>;
}
\`\`\`

**H. Using Cache Tags for On-Demand Revalidation**

\`\`\`typescript
import { unstable_cacheTag as cacheTag } from 'next/cache';

export async function getPosts() {
  "use cache";
  cacheTag('posts');
  
  const res = await fetch('http://api.cms.com/posts');
  return res.json();
}
\`\`\`

\`\`\`typescript
// In server action or API route
'use server';
import { revalidateTag } from 'next/cache';

export async function createPost(data) {
  await db.posts.create(data);
  revalidateTag('posts'); // Rebuilds all routes using 'posts' tag
}
\`\`\`

**I. Special Case: Suspense Around <body>**

\`\`\`typescript
// Most permissive mode - blocks like traditional SSR
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Suspense>
        <body>{children}</body>
      </Suspense>
    </html>
  );
}
\`\`\`

**After Each Fix:**
1. Save the file
2. Wait for Fast Refresh to apply changes (dev server still running, no restart needed)
3. Re-load the route in browser: chrome_devtools({ action: "navigate", url: "<base-url><route-path>" })
4. Connect to MCP Endpoint: \`<base-url>/_next/mcp\` (using endpoint from Step 6)
5. Call get_errors again via MCP to verify fix (collects from chrome session)
6. Verify error is resolved
7. Move to next error

**Continue until:**
- All routes return 200 OK
- get_errors returns no errors
- No console warnings related to Cache Components

**Important:**
- The dev server should REMAIN RUNNING throughout all fixes
- Fast Refresh automatically applies your changes
- Do NOT restart the server unless it crashes

## PHASE 6: Final Verification
────────────────────────────────────────

**Prerequisites:**
- ✅ All fixes applied in Phase 5
- ✅ Dev server is still running
- ✅ All routes verified with get_errors

Run comprehensive checks:

1. **All Routes Final Test**
   With dev server still running:
   - Request all routes one final time
   - Verify all return successfully (200 OK)
   - Call get_errors one last time via MCP
   - Expected: Empty error list

2. **Stop Dev Server**
   Now that development verification is complete:
   \`\`\`bash
   # Stop the background dev server process
   # (You can now safely stop it)
   \`\`\`

3. **Build Test**
   \`\`\`bash
   <pkg-manager> run build
   \`\`\`
   Expected: 
   - Build succeeds without errors
   - Build output shows cache status for each route
   - Check for any build-time errors that didn't appear in dev

4. **Production Test**
   \`\`\`bash
   <pkg-manager> start
   # Test a few key routes in production mode
   \`\`\`
   Expected:
   - Server starts successfully
   - Key routes work correctly
   - Cached content is served from prerendered shells

## Important Caching Behavior Notes
────────────────────────────────────────

### Memory Cache vs Persistent Cache

**Self-Hosting (Long-Running Server):**
- \`"use cache"\` entries saved in memory
- Available for subsequent requests within same process
- Lost when server restarts

**Vercel / Serverless:**
- NO memory cache between requests (lambda is ephemeral)
- \`"use cache"\` only effective if included in prerendered fallback shell
- If cached content is in same Suspense boundary as blocking content, it won't be in shell
- For persistent cache between requests, use \`"use cache: remote"\` to store in Vercel Data Cache (VDC)

**Key Implication:**
If you see a cached component re-executing on every request:
1. Check if there's blocking async IO in the same Suspense boundary
2. Either: Wrap blocking content in its own Suspense boundary
3. Or: Use \`"use cache: remote"\` for VDC storage

### Prefetching Behavior

**Production Only:**
- Link prefetching ONLY works in production (\`npm run build && npm start\`)
- In development, prefetching is disabled
- Test prefetching in production build before deploying

**What Gets Prefetched:**
- Static shells for routes with \`<Link>\` components in viewport
- Only NEW static content (not already in cache)
- Full cached components (with \`"use cache"\`)
- \`"use cache: private"\` content can be prefetched with runtime values (cookies, params, searchParams)

### Static Shell Storage

**Build Output:**
- Saved in \`.next\` directory during build
- Served as static assets (self-hosting)
- Stored in ISR cache on Vercel (globally distributed to edge)

**Partial Revalidation:**
- Can be revalidated without full rebuilds
- Using \`revalidateTag\` or \`revalidatePath\`
- Based on \`cacheLife\` revalidate/expire times

## OUTPUT FORMAT
────────────────────────────────────────
Report findings in this format:

\`\`\`
# Cache Components Setup Report

## Summary
- Project: ${projectPath}
- Next.js Version: [version]
- Package Manager: [detected manager]
- Mode: ${mode}

## Phase 1: Pre-Flight Checks
[x] Next.js version verified (16.0.0+)
[x] Package manager detected: [manager]
[x] Existing config checked
[x] Routes identified: [count] routes

## Phase 2: Configuration
${mode === "enable" ? "[x] Cache Components enabled in next.config\n[x] Configuration backed up\n[ ] cacheLife profiles reviewed" : "[ ] Skipped (verify-only mode)"}

## Phase 3: Dev Server
[x] Checked for existing servers/stale locks
[x] MCP server enabled: __NEXT_EXPERIMENTAL_MCP_SERVER=true
[x] Dev server started successfully (ONCE, ran throughout Phase 4-5)
[x] Base URL captured: [e.g., http://localhost:3001]
[x] MCP Endpoint: [e.g., http://localhost:3001/_next/mcp]
[x] MCP server verified active (get_project_metadata responded)
[x] No restart attempts during verification/fixing

## Phase 4: Route Verification Results

### Routes Tested: [count]
[List all routes with their status]

### Errors Found: [count]
[For each error:]
- Route: [route]
- Type: [error type]
- Message: [error message]
- File: [file path]
- Status: [Fixed/Pending]

## Phase 5: Fixes Applied
[List all fixes made, grouped by error type]

### A. Blocking Route Errors Fixed: [count]
- [file path]: Added Suspense boundary / Added "use cache" / Created loading.tsx
- [file path]: [specific fix applied]
- ...

### B. Dynamic Value Errors Fixed: [count]
- [file path]: Added await connection() before Math.random()/Date()
- ...

### C. Route Params Errors Fixed: [count]
- [file path]: Added generateStaticParams with known params
- ...

### D. Unavailable API Errors Fixed: [count]
- [file path]: Moved cookies()/headers() outside cache scope / Changed to "use cache: private"
- ...

### E. Route Segment Config Migrations: [count]
- [file path]: Removed export const dynamic, replaced with "use cache" + cacheLife
- ...

### F. Cache Optimizations Added: [count]
- [file path]: Added cacheLife profile for revalidation control
- [file path]: Added cacheTag for granular revalidation
- ...

## Phase 6: Final Verification
[x] All routes return 200 OK (with dev server running)
[x] No errors in get_errors final check
[x] Dev server stopped after verification
[x] Build succeeds
[x] Production mode tested

## Migration Notes
${mode === "enable" ? "[Any special notes about the migration, especially if migrating from PPR]" : ""}

## Next Steps
- Monitor application behavior in development
- Test interactive features with Cache Components
- Review cacheLife profile usage
- Consider enabling Turbopack file system caching for faster dev

## Troubleshooting Tips
- If cached components re-execute on every request: Check Suspense boundaries, consider "use cache: remote"
- If prefetching doesn't work: Test in production build, not dev mode
- If routes still show blocking errors: Look for parent Suspense or add "use cache"
- If "use cache" with params fails: Add generateStaticParams
- If dynamic APIs fail in cache: Move outside cache scope or use "use cache: private"
- If Route Segment Config errors: Remove exports, use "use cache" + cacheLife instead
\`\`\`

# START HERE
${mode === "verify-only" ? "Begin verification of existing Cache Components setup. Check configuration and verify all routes work correctly." : "Begin Cache Components enablement:\n1. Start with Phase 1 pre-flight checks\n2. Enable Cache Components in config (Phase 2)\n3. Start dev server with MCP (Phase 3) - **START ONLY ONCE, DO NOT RESTART**\n4. Systematically verify each route and collect errors (Phase 4)\n5. Fix all errors automatically (Phase 5)\n6. Run final verification (Phase 6)"}

**Critical Rules:**
- **NEVER restart the dev server** - Start it once in Phase 3, let it run through Phase 4 and 5
- Use the get_errors MCP tool frequently to catch and fix issues early
- If you see lock file or port errors, the server is already running - DO NOT start again
- The goal is zero errors and all routes working with Cache Components enabled`,
        },
      },
    ],
  }
}
