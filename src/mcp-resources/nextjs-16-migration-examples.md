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
- `updateTag(tag, profile)` for Server Actions (read-your-own-writes)
- `revalidateTag(tag, profile)` for Route Handlers (background invalidation)

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
  const resolvedParams = await params  // params is now a Promise
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
  updateTag('posts', 'max')  // Immediate consistency
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
| `updateTag('tag', 'max')` | Server Actions needing immediate reads | Read-your-own-writes semantics |
| `revalidateTag('tag', 'max')` | Route Handlers or background updates | Background invalidation |

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

