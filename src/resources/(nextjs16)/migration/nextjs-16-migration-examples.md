# Next.js 16 Migration Guide

Complete reference and code examples for migrating to Next.js 16 stable.

---

## 🚨 Quick Reference: Critical Breaking Changes

### Version Requirements

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | 20.9+ | Node.js 18 no longer supported |
| **TypeScript** | 5.1+ | TypeScript 5.0 minimum |
| **Browsers** | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ | Updated minimum versions |

### Must-Change APIs

**1. Async Request APIs** - `params`, `searchParams` are now Promises
- Affected: Pages, Layouts, Route Handlers, `generateMetadata`, `generateViewport`, metadata image routes
- Pattern: `function Page({ params })` → `async function Page(props)` + `await props.params`

**2. Async Dynamic Functions** - `cookies()`, `headers()`, `draftMode()` return Promises
- Pattern: `cookies().get()` → `(await cookies()).get()`

**3. revalidateTag API** - Now requires profile parameter
- `updateTag(tag)` for Server Actions (read-your-own-writes, no profile parameter)
- `revalidateTag(tag, profile)` for Route Handlers (background invalidation, requires profile)

### Completely Removed

- **AMP Support:** All AMP APIs removed
- **Runtime Config:** `serverRuntimeConfig`, `publicRuntimeConfig` → use `.env` files
- **PPR Flags:** `experimental.ppr`, `experimental_ppr` → use `experimental.cacheComponents`
- **experimental.dynamicIO:** Renamed to `experimental.cacheComponents`
- **unstable_rootParams():** Removed (alternative coming)
- **Auto scroll-behavior:** No longer automatic (add `data-scroll-behavior="smooth"` to `<html>` if needed)
- **devIndicators options:** `appIsrStatus`, `buildActivity`, `buildActivityPosition` removed

### Config Migrations

- **Turbopack:** Now default (remove `--turbopack` flags, use `--webpack` if needed)
- **ESLint config:** Remove from next.config.js, move to `.eslintrc.json`
- **serverComponentsExternalPackages:** Move from `experimental` to top-level
- **Middleware → Proxy:** Rename `middleware.ts` → `proxy.ts` (deprecated but works)

### Quick Checklist

✅ Node.js 20.9+, TypeScript 5.1+  
✅ Remove: AMP, runtime configs, PPR flags, devIndicators options  
✅ Make async: All functions using params, searchParams, cookies(), headers(), draftMode()  
✅ Update: `revalidateTag()` → `updateTag()` or `revalidateTag(tag, profile)`  
✅ Config: Remove ESLint config, move serverComponentsExternalPackages to top-level  
✅ Parallel Routes: Add `default.js` for `@` folders  
✅ Dependencies: Upgrade `@types/react` and `@types/react-dom` to latest  

---

## 📖 Complete Code Examples

### Table of Contents

1. [Removed Features Examples](#removed-features-examples)
2. [Parallel Routes Examples](#parallel-routes-examples)
3. [Image Configuration Examples](#image-configuration-examples)
4. [Config Migration Examples](#config-migration-examples)
5. [Async API Migration Examples](#async-api-migration-examples)
6. [Cache Invalidation Examples](#cache-invalidation-examples)
7. [Middleware to Proxy Examples](#middleware-to-proxy-examples)
8. [unstable_noStore Examples](#unstable_nostore-examples)
9. [Cache Components Examples](#cache-components-examples)

---

## Removed Features Examples

### AMP Support Removal

```bash
# Search for AMP usage
grep -r "useAmp\|amp:" app/ src/ pages/
```

**Migration:**
```typescript
// ❌ BEFORE - Remove these
import { useAmp } from 'next/amp'

export default function Page() {
  const isAmp = useAmp()
  // ...
}

export const config = { amp: true }

// ✅ AFTER - No replacement
// Remove all AMP code
// Consider alternative approaches for mobile performance
```

### Runtime Config Removal

```bash
# Search for runtime config
grep -r "serverRuntimeConfig\|publicRuntimeConfig" next.config.*
```

**Migration:**
```diff
// ❌ BEFORE - next.config.js
module.exports = {
- serverRuntimeConfig: { apiKey: 'secret' },
- publicRuntimeConfig: { apiUrl: 'https://api.example.com' }
}

// ✅ AFTER - Use .env files
// .env.local
API_KEY=secret
NEXT_PUBLIC_API_URL=https://api.example.com
```

**Usage:**
```typescript
// In your code
const apiKey = process.env.API_KEY  // Server-side only
const apiUrl = process.env.NEXT_PUBLIC_API_URL  // Client and server
```

### PPR Flags Removal

```bash
# Search for PPR configs
grep -r "experimental.ppr\|experimental_ppr" next.config.* app/ src/
```

**Migration:**
```diff
// ❌ BEFORE - next.config.js
module.exports = {
- experimental: {
-   ppr: true,
- }
}

// ❌ BEFORE - app/page.tsx
- export const experimental_ppr = true

// ✅ AFTER - Use Cache Components model
module.exports = {
  experimental: {
    cacheComponents: true,  // New Cache Components model
  }
}
```

### experimental.dynamicIO Rename

```bash
# Search for old flag
grep -r "experimental.dynamicIO" next.config.*
```

**Migration:**
```diff
// next.config.js
module.exports = {
  experimental: {
-   dynamicIO: true,
+   cacheComponents: true,
  }
}
```

### unstable_rootParams() Removal

```bash
# Search for usage
grep -r "unstable_rootParams" app/ src/
```

**Migration:**
```typescript
// ❌ BEFORE
import { unstable_rootParams } from 'next/navigation'

export default function Page() {
  const params = unstable_rootParams()
  // ...
}

// ✅ AFTER - Temporary workaround
// Use params from props instead
export default async function Page(props) {
  const params = await props.params
  // ...
}

// Note: Alternative API coming in upcoming minor release
```

### Automatic scroll-behavior: smooth Removal

**Migration:**
```tsx
// ❌ BEFORE - This was automatic
// Next.js automatically added scroll-behavior: smooth

// ✅ AFTER - Add manually if needed
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
```

### devIndicators Config Options Removal

```bash
# Search for dev indicators config
grep -r "devIndicators" next.config.*
```

**Migration:**
```diff
// next.config.js
module.exports = {
- devIndicators: {
-   appIsrStatus: true,
-   buildActivity: true,
-   buildActivityPosition: 'bottom-right',
- }
}

// Note: The dev indicator itself remains, just these config options are removed
```

---

## Parallel Routes Examples

### Creating default.js Files

```bash
# Find all parallel route folders
find app -type d -name "@*" | grep -v "@children"
```

**Migration:**
```typescript
// Create: app/@modal/default.js (for @modal, @auth, etc.)
export default function Default() {
  return null
}

// Or if you want to show notFound
import { notFound } from 'next/navigation'

export default function Default() {
  notFound()
}
```

**Note:** `@children` is a special implicit slot and does NOT require a `default.js` file.

---

## Image Configuration Examples

### Image Security Config (Local Images with Query Strings)

```diff
// next.config.js
module.exports = {
+ images: {
+   localPatterns: [{ pathname: '/img/**' }]
+ }
}
```

**When is this needed?**
If you use local images with query strings like:
```tsx
import Image from 'next/image'

// This requires localPatterns config
<Image src="/img/photo.jpg?v=123" alt="Photo" width={500} height={300} />
```

### Image Default Changes Review

**Defaults that changed in v16:**
```javascript
// next.config.js - Override if needed
module.exports = {
  images: {
    // Old default: 60, New default: 14400 (4 hours)
    minimumCacheTTL: 14400,
    
    // Old default: [1..100], New default: [75]
    qualities: [75],
    
    // Old default: [16, 32, 48, 64, 96, 128, 256, 384]
    // New default: [32, 48, 64, 96, 128, 256, 384] (removed 16)
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    
    // Old default: undefined (allowed), New default: false
    dangerouslyAllowLocalIP: false,
    
    // Old default: unlimited, New default: 3
    maximumRedirects: 3,
  }
}
```

---

## Config Migration Examples

### ESLint Config Removal

```bash
# Search for ESLint config in next.config
grep -r "eslint:" next.config.*
```

**Migration:**
```diff
// ❌ BEFORE - next.config.js
module.exports = {
- eslint: {
-   ignoreDuringBuilds: true,
-   dirs: ['app', 'src'],
- },
}

// ✅ AFTER - Move to .eslintrc.json
// .eslintrc.json
{
  "extends": "next/core-web-vitals",
  "ignorePatterns": ["node_modules/", ".next/"]
}

// Or use the codemod:
// npx @next/codemod@canary next-lint-to-eslint-cli .
```

### serverComponentsExternalPackages Migration

```diff
// next.config.js
module.exports = {
- experimental: {
-   serverComponentsExternalPackages: ['package-name'],
- },
+ serverComponentsExternalPackages: ['package-name'],
}
```

### Turbopack Config Rename (Canary Users)

```diff
// next.config.js
module.exports = {
- turbopackPersistentCachingForDev: true,
+ turbopackFileSystemCacheForDev: true,
}
```

### Remove --turbopack Flags

```diff
// package.json
{
  "scripts": {
-   "dev": "next dev --turbopack",
-   "build": "next build --turbopack"
+   "dev": "next dev",
+   "build": "next build"
  }
}

// If you need webpack instead, use --webpack flag:
// "dev": "next dev --webpack"
```

---

## Async API Migration Examples

### Metadata Image Routes

```typescript
// ❌ BEFORE (Next.js 15)
// app/blog/[slug]/opengraph-image.tsx
export default function Image({ params, id }) {
  const slug = params.slug
  const imageId = id  // string
  // Generate image...
}

export async function generateImageMetadata({ params }) {
  return [
    { id: 'default', size: { width: 1200, height: 630 } },
    { id: 'large', size: { width: 1800, height: 945 } }
  ]
}

// ✅ AFTER (Next.js 16)
// app/blog/[slug]/opengraph-image.tsx
export default async function Image({ params, id }) {
  const resolvedParams = await params  // params is now a Promise
  const slug = resolvedParams.slug
  const imageId = id  // string (id itself is not a Promise)
  // Generate image...
}

export async function generateImageMetadata({ params }) {
  return [
    { id: 'default', size: { width: 1200, height: 630 } },
    { id: 'large', size: { width: 1800, height: 945 } }
  ]
}
```

### Complex Async Destructuring

```typescript
// ❌ WRONG - Cannot destructure Promise
export default async function Page({ params }) {
  // params is still a Promise here!
  const slug = params.slug  // ERROR
}

// ❌ WRONG - Cannot destructure in signature
export default async function Page({ params: { slug } }) {
  // ERROR: Cannot destructure Promise
}

// ✅ CORRECT
export default async function Page(props) {
  const params = await props.params
  const slug = params.slug
}

// ✅ CORRECT - Destructure after awaiting
export default async function Page(props) {
  const { slug } = await props.params
}
```

### Conditional Usage

```typescript
// ✅ CORRECT - Always await even in conditionals
export default async function Page(props) {
  const searchParams = await props.searchParams
  
  if (searchParams.debug) {
    console.log('Debug mode enabled')
  }
  
  return <div>...</div>
}
```

### Route Handlers

```typescript
// ❌ BEFORE
export async function GET(request: Request, { params }) {
  const id = params.id
  return Response.json({ id })
}

// ✅ AFTER
export async function GET(request: Request, props) {
  const params = await props.params
  const id = params.id
  return Response.json({ id })
}
```

---

## Cache Invalidation Examples

### revalidateTag Migration

```bash
# Find all revalidateTag calls
grep -r "revalidateTag(" app/ src/
```

**Migration:**

```typescript
// ❌ OLD (deprecated)
import { revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  'use server'
  
  await db.posts.create(data)
  revalidateTag('posts')  // Deprecated signature
}

// ✅ OPTION 1: Use updateTag for Server Actions (read-your-own-writes)
import { updateTag } from 'next/cache'

export async function createPost(data: FormData) {
  'use server'

  await db.posts.create(data)
  updateTag('posts')  // Immediate consistency (read-your-own-writes)
}

// ✅ OPTION 2: Use revalidateTag with profile (background invalidation)
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  await db.posts.create(await request.json())
  revalidateTag('posts', 'max')  // Background invalidation
  return Response.json({ success: true })
}
```

**When to use which:**

| API | Use Case | Behavior |
|-----|----------|----------|
| `updateTag('tag')` | Server Actions needing immediate reads | Read-your-own-writes semantics, no profile parameter |
| `revalidateTag('tag', 'max')` | Route Handlers or background updates | Background invalidation with profile |

**cacheLife Profiles:**
```typescript
// Common profiles to use as second argument
'max'     // Maximum staleness
'hours'   // Medium staleness
'minutes' // Minimal staleness
'default' // Default profile
```

---

## Middleware to Proxy Examples

### File Rename

```bash
# Rename the file
mv middleware.ts proxy.ts
```

### Function Export Rename

```diff
- // middleware.ts
- export function middleware(request) {
+ // proxy.ts
+ export function proxy(request) {
    return NextResponse.next()
  }
  
- export const config = {
+ export const config = {
    matcher: '/api/:path*',
  }
```

### Config Property Renames

```bash
# Find middleware config usage
grep -r "middlewarePrefetch\|middlewareClientMaxBodySize\|externalMiddlewareRewritesResolve\|skipMiddlewareUrlNormalize" .
```

**Migration:**
```diff
// next.config.js
module.exports = {
  experimental: {
-   middlewarePrefetch: 'strict',
+   proxyPrefetch: 'strict',

-   middlewareClientMaxBodySize: 1024,
+   proxyClientMaxBodySize: 1024,

-   externalMiddlewareRewritesResolve: true,
+   externalProxyRewritesResolve: true,
  },

- skipMiddlewareUrlNormalize: true,
+ skipProxyUrlNormalize: true,
}
```

---

## unstable_noStore Examples

**IMPORTANT:** `unstable_noStore()` is only incompatible when Cache Components are enabled. If you're not using `experimental.cacheComponents`, you can continue using it.

### Search for Usage

```bash
# Find all unstable_noStore usage
grep -r "unstable_noStore" app/ src/
```

### Basic Removal (Keep Dynamic)

```diff
- import { unstable_noStore } from 'next/cache'
  
  export default async function Page() {
-   unstable_noStore() // Opt-out of static rendering
+   // MIGRATED: Removed unstable_noStore() - dynamic by default with Cache Components
+   // This component executes on every request (dynamic behavior)
    
    const data = await fetch('https://api.example.com/data')
    return <div>{data}</div>
  }
```

### Migration with Suspense Boundary

```diff
- import { unstable_noStore } from 'next/cache'
+ import { Suspense } from 'react'
  
  export default async function Page() {
-   unstable_noStore()
+   // MIGRATED: Removed unstable_noStore() and added Suspense boundary
+   // Dynamic content wrapped in Suspense for better UX
+   return (
+     <Suspense fallback={<Loading />}>
+       <DynamicContent />
+     </Suspense>
+   )
+ }
  
+ async function DynamicContent() {
+   // No unstable_noStore() needed - dynamic by default
    const data = await fetch('https://api.example.com/data')
    return <div>{data}</div>
  }
```

### Migration to Cached Content

If you realize the content should actually be cached:

```diff
- import { unstable_noStore } from 'next/cache'
+ import { cacheLife } from 'next/cache'
  
  export default async function Page() {
-   unstable_noStore() // Was preventing caching
+   "use cache"
+   // MIGRATED: Removed unstable_noStore() - decided to cache this content instead
+   // DECISION: Content changes hourly, cacheable to reduce server load
+   
+   // Uncomment to enable time-based revalidation:
+   // cacheLife('hours')
    
    const data = await fetch('https://api.example.com/data')
    return <div>{data}</div>
  }
```

### Complete Example: Page with Multiple Components

**Before:**
```typescript
// app/dashboard/page.tsx
import { unstable_noStore } from 'next/cache'

export default async function Dashboard() {
  unstable_noStore() // Make everything dynamic
  
  const user = await getCurrentUser()
  const stats = await getStats()
  const settings = await getSettings()
  
  return (
    <div>
      <Header user={user} />
      <Stats data={stats} />
      <Settings data={settings} />
    </div>
  )
}
```

**After (Hybrid Approach):**
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { cacheLife } from 'next/cache'

// MIGRATED: Removed unstable_noStore()
// Now using hybrid approach - cache static parts, dynamic user content
export default async function Dashboard() {
  return (
    <div>
      <CachedHeader />
      <Suspense fallback={<StatsSkeleton />}>
        <DynamicStats />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <DynamicSettings />
      </Suspense>
    </div>
  )
}

async function CachedHeader() {
  "use cache"
  // cacheLife('hours') // Uncomment to enable revalidation
  
  // Static header - same for all users
  const settings = await getGlobalSettings()
  return <Header settings={settings} />
}

async function DynamicStats() {
  // Dynamic per user - no unstable_noStore needed
  const user = await getCurrentUser()
  const stats = await getStats(user.id)
  return <Stats data={stats} />
}

async function DynamicSettings() {
  // Dynamic per user - no unstable_noStore needed
  const user = await getCurrentUser()
  const settings = await getUserSettings(user.id)
  return <Settings data={settings} />
}
```

### Why This Migration Matters

**Old Caching Model (Next.js 15 and earlier):**
- Everything was static by default
- `unstable_noStore()` opted out of caching
- Used to make routes dynamic

**New Cache Components Model (Next.js 16 with cacheComponents):**
- Everything is dynamic by default
- `"use cache"` opts into caching
- `unstable_noStore()` is redundant and causes errors

**Key Insight:** The paradigm is reversed. You no longer need to opt-out of caching; instead, you opt-in to caching only where it makes sense.

---

## ViewTransition API Migration

### Import Rename

```bash
# Find ViewTransition usage
grep -r "unstable_ViewTransition" app/ src/
```

**Migration:**
```diff
- import { unstable_ViewTransition } from 'react'
+ import { ViewTransition } from 'react'

  export default function App({ children }) {
    return (
-     <unstable_ViewTransition>
+     <ViewTransition>
        {children}
-     </unstable_ViewTransition>
+     </ViewTransition>
    )
  }
```

### Remove Experimental Flag

```diff
// next.config.js
module.exports = {
- experimental: {
-   viewTransition: true,
- },
}
```

---

## Lint Command Migration

### Update package.json Scripts

```diff
// package.json
{
  "scripts": {
-   "lint": "next lint"
+   "lint": "eslint ."
  }
}
```

### Or Use Biome

```diff
// package.json
{
  "scripts": {
-   "lint": "next lint"
+   "lint": "biome check ."
  }
}
```

### Or Use Codemod

```bash
# Automated migration to ESLint CLI
npx @next/codemod@canary next-lint-to-eslint-cli .
```

---

## Complete Migration Example

Here's a complete before/after example of a typical Next.js page:

### Before (Next.js 15)

```typescript
// app/blog/[slug]/page.tsx
import { cookies, headers } from 'next/headers'

export const dynamic = 'force-static'  // Will cause error
export const revalidate = 3600  // Will cause error

export default function BlogPost({ params, searchParams }) {
  const slug = params.slug
  const highlight = searchParams.highlight
  const token = cookies().get('token')
  const userAgent = headers().get('user-agent')
  
  return <div>Post: {slug}</div>
}

export async function generateMetadata({ params }) {
  return {
    title: `Blog Post: ${params.slug}`
  }
}
```

### After (Next.js 16)

```typescript
// app/blog/[slug]/page.tsx
import { cookies, headers } from 'next/headers'

// Removed: dynamic, revalidate (incompatible with cacheComponents)

export default async function BlogPost(props) {
  const params = await props.params
  const searchParams = await props.searchParams
  
  const slug = params.slug
  const highlight = searchParams.highlight
  const token = (await cookies()).get('token')
  const userAgent = (await headers()).get('user-agent')
  
  return <div>Post: {slug}</div>
}

export async function generateMetadata(props) {
  const params = await props.params
  return {
    title: `Blog Post: ${params.slug}`
  }
}
```

---

## Environment Variables Example

### Migrating from Runtime Config

```typescript
// ❌ BEFORE - Using runtime config
// next.config.js
module.exports = {
  serverRuntimeConfig: {
    apiKey: process.env.API_KEY,
    dbUrl: process.env.DATABASE_URL,
  },
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL,
  }
}

// Usage
import getConfig from 'next/config'

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()
console.log(serverRuntimeConfig.apiKey)
console.log(publicRuntimeConfig.apiUrl)

// ✅ AFTER - Using environment variables
// .env.local
API_KEY=secret_key_here
DATABASE_URL=postgres://...
NEXT_PUBLIC_API_URL=https://api.example.com

// Usage - Direct access
console.log(process.env.API_KEY)  // Server-side only
console.log(process.env.DATABASE_URL)  // Server-side only
console.log(process.env.NEXT_PUBLIC_API_URL)  // Client and server
```

**Key differences:**
- Server-only variables: Regular env vars (e.g., `API_KEY`)
- Public variables: Prefix with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_API_URL`)
- No need to import `getConfig`
- Direct access via `process.env`

---

## Cache Components Examples

### 3rd Party Package Workarounds

When enabling Cache Components, you may encounter errors from third-party packages in `node_modules/`. Here are common workaround patterns:

#### Document the Issue

```typescript
// ⚠️ 3RD PARTY PACKAGE ISSUE: [package-name@version]
// Error: [error message from build]
// Source: node_modules/[package-name]/[file]
// Status: [Workaround applied / Cannot fix / Reported to package maintainer]
```

#### Workaround 1: Wrap in Suspense Boundary

**Most common workaround - wrap the component using the package:**

```typescript
// ⚠️ 3RD PARTY PACKAGE ISSUE: analytics-widget@1.2.3
// Error: Package uses dynamic values without proper async handling
// Source: node_modules/analytics-widget/dist/index.js
// Status: Workaround applied - wrapped in Suspense boundary
import { Suspense } from 'react'
import { AnalyticsWidget } from 'analytics-widget'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
```

#### Workaround 2: Dynamic Import

**Load the package only when needed:**

```typescript
// ⚠️ 3RD PARTY PACKAGE ISSUE: heavy-chart-library@2.0.0
// Error: Package blocks initial render
// Source: node_modules/heavy-chart-library/dist/Chart.js
// Status: Workaround applied - using dynamic import
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ChartComponent = dynamic(() => import('heavy-chart-library').then(mod => mod.Chart), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Disable server-side rendering if needed
})

export default function Page() {
  return (
    <div>
      <h1>Sales Dashboard</h1>
      <ChartComponent data={salesData} />
    </div>
  )
}
```

#### Workaround 3: Move to Separate Dynamic Component

**Isolate package usage in its own component:**

```typescript
// ⚠️ 3RD PARTY PACKAGE ISSUE: payment-sdk@3.1.0
// Error: Package expects sync context
// Source: node_modules/payment-sdk/dist/PaymentForm.js
// Status: Workaround applied - isolated in separate component
import { Suspense } from 'react'

export default function CheckoutPage() {
  return (
    <div>
      <h1>Checkout</h1>
      <Suspense fallback={<div>Loading payment form...</div>}>
        <PaymentFormWrapper />
      </Suspense>
    </div>
  )
}

async function PaymentFormWrapper() {
  // Separate component to handle the problematic package
  const { PaymentForm } = await import('payment-sdk')
  return <PaymentForm />
}
```

### cacheLife() and cacheTag() Comment Templates

When adding `"use cache"` directives, always include commented import templates to guide developers on revalidation strategies.

#### Template Pattern

```typescript
// ⚠️ CACHING STRATEGY DECISION NEEDED:
// This component uses "use cache" - decide on revalidation strategy
// 
// Uncomment ONLY ONE of the following strategies based on your needs:

// Option A: Time-based revalidation (most common)
// import { cacheLife } from 'next/cache';
// cacheLife('hours');  // Revalidates every hour, expires after 1 day

// Option B: On-demand tag-based revalidation
// import { cacheTag } from 'next/cache';
// cacheTag('resource-name');  // Tag for manual revalidation via updateTag/revalidateTag

// Option C: Long-term caching (use sparingly)
// import { cacheLife } from 'next/cache';
// cacheLife('max');  // Revalidates every 30 days, cached for 1 year

// Option D: Short-lived cache (frequently updated content)
// import { cacheLife } from 'next/cache';
// cacheLife('minutes');  // Revalidates every minute, expires after 1 hour

// Option E: Custom inline profile (advanced)
// import { cacheLife } from 'next/cache';
// cacheLife({ 
//   stale: 300,      // Client caches for 5 minutes
//   revalidate: 3600,  // Revalidates every hour
//   expire: 86400      // Expires after 24 hours
// });

export default async function Page() {
  "use cache";
  // User should uncomment and configure ONE of the cacheLife/cacheTag options above
  
  const data = await fetch('...');
  return <div>{data}</div>;
}
```

### Caching Strategy Examples

#### Strategy A: Time-Based Revalidation (Recommended)

**For content that changes on a predictable schedule:**

```typescript
// DECISION: Blog posts change daily, cached for speed
// Using 'hours' profile: revalidates every hour, expires after 1 day
import { cacheLife } from 'next/cache';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  "use cache";
  cacheLife('hours');  // Uncommented after decision made
  
  const { slug } = await params;
  const post = await fetchFromCMS(slug);
  return <article>{post.content}</article>;
}
```

**When to use:**
- Content that changes on predictable schedules
- User-facing pages that can show slightly stale data
- High-traffic routes needing caching performance

#### Strategy B: Tag-Based Revalidation (Event-Triggered)

**For content that updates based on specific events:**

```typescript
// DECISION: Product details cached, revalidate on inventory changes
// Use cacheTag to manually trigger revalidation when product updates
import { cacheTag } from 'next/cache';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  "use cache";
  
  const { id } = await params;
  cacheTag('products', `product-${id}`);  // Multiple tags for granular control
  
  const product = await fetchProduct(id);
  return <ProductDisplay product={product} />;
}

// In your admin panel or API route:
// import { updateTag } from 'next/cache';
// await updateTag('products');  // Revalidate all products
// await updateTag(`product-${id}`);  // Revalidate specific product
```

**When to use:**
- Content that updates unpredictably (admin actions)
- E-commerce products with inventory changes
- CMS-managed content with manual publish events
- Multiple related resources that revalidate together

#### Strategy C: Long-Term Caching

**For truly immutable content:**

```typescript
// DECISION: Content rarely changes (archived pages, historical data)
// Using 'max' profile: revalidates every 30 days, cached for 1 year
import { cacheLife } from 'next/cache';

export default async function ArchivePage({ params }: { params: Promise<{ year: string }> }) {
  "use cache";
  cacheLife('max');
  
  const { year } = await params;
  const archiveData = await fetchArchive(year);
  return <Archive data={archiveData} />;
}
```

**When to use:**
- Truly immutable content (historical data, archived pages)
- Reference content that never changes
- Static files rendered as components

#### Strategy D: Short-Lived Cache

**For frequently updating content:**

```typescript
// DECISION: Metrics update frequently, need low revalidation time
// Using 'minutes' profile: revalidates every minute, expires after 1 hour
import { cacheLife } from 'next/cache';

export default async function RealtimeMetrics() {
  "use cache";
  cacheLife('minutes');
  
  const metrics = await fetchMetrics();
  return <Dashboard metrics={metrics} />;
}
```

**When to use:**
- Dashboards and real-time data
- Leaderboards and rankings
- Stock prices and live data
- Activity feeds

#### Strategy E: Multiple Cache Tags

**For complex revalidation scenarios:**

```typescript
// DECISION: Cache user dashboard with multiple revalidation triggers
// Revalidate on: user profile changes, new comments, new notifications
import { cacheTag } from 'next/cache';

export default async function UserDashboard({ params }: { params: Promise<{ userId: string }> }) {
  "use cache";
  
  const { userId } = await params;
  
  // Multiple tags for different revalidation scenarios
  cacheTag('user-dashboard', `user-${userId}`);
  cacheTag('user-profile', `user-${userId}`);
  cacheTag('user-comments', `user-${userId}`);
  cacheTag('user-notifications', `user-${userId}`);
  
  const dashboard = await buildDashboard(userId);
  return <Dashboard data={dashboard} />;
}
```

### Hybrid Caching Patterns

#### Mix Cached and Dynamic Content

```typescript
// DECISION: Header is shared (cache it), user content is personal (dynamic)
import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

export default async function Page() {
  return (
    <div>
      <CachedHeader />
      <Suspense fallback={<Loading />}>
        <DynamicUserContent />
      </Suspense>
    </div>
  )
}

async function CachedHeader() {
  "use cache";
  cacheLife('hours');
  cacheTag('site-settings');
  
  // Static: Same for all users, changes infrequently
  const settings = await fetch('https://api.cms.com/settings');
  return <header>{/* ... */}</header>;
}

async function DynamicUserContent() {
  // Dynamic: Per-request, user-specific
  const user = await getCurrentUser();
  return <div>{user.notifications}</div>;
}
```

### Private Cache Examples

#### Using "use cache: private" for Prefetchable User Content

**When content uses cookies but should be prefetchable:**

```typescript
// DECISION: Uses cookies but can be prefetched during navigation
// Changes per user but can be rendered ahead of actual navigation
import { cookies } from 'next/headers'

export default async function UserPreferences() {
  "use cache: private";
  
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');
  
  // Will be prefetched with actual cookie values during navigation
  const userData = await fetch(`https://api.example.com/users/${userId}`);
  return <div>{/* render */}</div>;
}
```

### Decision Guide: Static vs Dynamic

When encountering Cache Components errors, use this decision framework:

#### Question 1: "Is this content the same for all users?"
- ✅ YES → Strong candidate for `"use cache"`
- ❌ NO → Consider Suspense or `"use cache: private"`

#### Question 2: "How often does this content change?"
- **Rarely (days/weeks):** `"use cache"` with long `cacheLife` - Marketing pages, documentation
- **Occasionally (hours):** `"use cache"` with medium `cacheLife` - Blog posts, product catalogs
- **Frequently (minutes):** `"use cache"` with short `cacheLife` - News feeds, leaderboards
- **Constantly (per-request):** Use Suspense - User auth state, shopping cart, notifications

#### Question 3: "Does this content use user-specific data?"
- ✅ YES, from cookies/session → Use Suspense OR `"use cache: private"`
- ✅ YES, from route params → Can use `"use cache"` + `generateStaticParams`
- ❌ NO → Use `"use cache"`

#### Question 4: "Can this content be revalidated on-demand?"
- ✅ YES (CMS updates, admin actions) → Use `"use cache"` + `cacheTag()`
- ❌ NO (no clear trigger) → Use time-based `cacheLife` or Suspense

#### Decision Approaches with Examples

**Approach A: Cache It (Static)**
```typescript
// DECISION: Shared across users, changes rarely (daily)
// Cached to reduce server load and enable instant navigation
export default async function Page() {
  "use cache";
  cacheLife('hours'); // Revalidates every hour
  cacheTag('blog-posts'); // Enable on-demand revalidation
  
  const posts = await fetch('http://api.cms.com/posts');
  return <div>{/* render */}</div>;
}
```

**Approach B: Make It Dynamic (Per-Request)**
```typescript
// DECISION: User-specific, changes per request
// Using Suspense to show loading state while fetching fresh data
export default async function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserDashboard />
    </Suspense>
  );
}

async function UserDashboard() {
  const user = await getCurrentUser();
  return <div>{user.name}</div>;
}
```

**Approach C: Mix Both (Hybrid)**
```typescript
// DECISION: Header is shared (cache it), user content is personal (dynamic)
export default async function Page() {
  return (
    <div>
      <CachedHeader />
      <Suspense fallback={<Loading />}>
        <DynamicUserContent />
      </Suspense>
    </div>
  );
}

async function CachedHeader() {
  "use cache";
  cacheLife('hours');
  cacheTag('site-settings');
  const settings = await fetch('http://api.cms.com/settings');
  return <header>{/* ... */}</header>;
}

async function DynamicUserContent() {
  const user = await getCurrentUser();
  return <div>{user.notifications}</div>;
}
```

#### Decision Summary Table

| Content Type | User-Specific? | Update Frequency | Recommended Approach |
|--------------|----------------|------------------|----------------------|
| Marketing pages | No | Rarely | `"use cache"` + long `cacheLife` |
| Blog posts | No | Daily/Weekly | `"use cache"` + `cacheTag()` |
| Product catalog | No | Hourly | `"use cache"` + medium `cacheLife` |
| News feed | No | Minutes | `"use cache"` + short `cacheLife` |
| User dashboard | Yes | Per-request | `<Suspense>` |
| Shopping cart | Yes | Per-request | `<Suspense>` |
| User settings page | Yes | Occasionally | `"use cache: private"` |
| Auth-gated content | Yes | Varies | `"use cache: private"` |

### Handling `new Date()` and `Math.random()`

When migrating to Cache Components, `new Date()` and `Math.random()` require explicit handling:

**Problem:** These return different values on every call, creating ambiguity in cached components.

#### Decision Framework

Ask: **"Should this value be captured at cache time, or fresh per-request?"**

**Option 1: Fresh Per-Request (Recommended)**
```typescript
// Use for: timestamps, random IDs, request-specific values
export default async function Page() {
  "use cache: private"; // Always fresh, never cached
  const timestamp = new Date().toISOString();
  return <div>Generated at: {timestamp}</div>;
}
```

**Option 2: Captured at Cache Time (With Awareness)**
```typescript
// Use for: "createdAt" timestamps, random seed values that should be stable
export default async function Page() {
  "use cache";
  cacheLife('days');
  
  // ⚠️ CACHE DECISION: This timestamp is frozen at cache time
  // It will stay the same for all users for 24 hours
  const generatedAt = new Date().toISOString();
  return <div>Generated at: {generatedAt}</div>;
}
```

**Option 3: Extract to Separate Dynamic Component**
```typescript
// Best for mixed static + dynamic content
export default async function Page() {
  "use cache";
  cacheLife('days');
  
  return (
    <div>
      <MainContent />
      <Suspense fallback={<Spinner />}>
        <DynamicTimestamp />
      </Suspense>
    </div>
  );
}

async function DynamicTimestamp() {
  "use cache: private"; // Always fresh
  const timestamp = new Date().toISOString();
  return <p>Rendered at: {timestamp}</p>;
}
```

#### Common Patterns

| Pattern | Behavior | Fix |
|---------|----------|-----|
| `new Date()` in cached component | Frozen at cache time | Add comment explaining tradeoff, or extract to `"use cache: private"` |
| `Math.random()` for IDs | Same ID until cache revalidates | Use `"use cache: private"` if ID should be unique per user/request |
| `new Date()` in SSR function | Captured at build time | Use `await connection()` or move to `"use cache: private"` |

### Removing Route Segment Config

When enabling Cache Components, remove all Route Segment Config exports:

```typescript
// ❌ BEFORE - Route Segment Config (incompatible with Cache Components)
export const dynamic = 'force-static'
export const revalidate = 3600
export const fetchCache = 'force-cache'

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}

// ✅ AFTER - Cache Components approach
// MIGRATED: Removed export const dynamic = 'force-static' (incompatible with Cache Components)
// MIGRATED: Removed export const revalidate = 3600 (incompatible with Cache Components) 
// MIGRATED: Removed export const fetchCache = 'force-cache' (incompatible with Cache Components)
// DECISION: Content changes hourly, cached for performance
import { cacheLife } from 'next/cache'

export default async function Page() {
  "use cache";
  cacheLife('hours');  // Equivalent to old revalidate: 3600
  
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

---

