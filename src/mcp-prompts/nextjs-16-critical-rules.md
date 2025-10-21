# Next.js 16 Critical Migration Rules

**📖 For detailed code examples:** Load resource `nextjs16://migration/examples` for comprehensive before/after examples, edge cases, and complete migration patterns.

This document provides quick-reference rules and minimal examples. For full implementation details, use the migration examples resource.

---

## 🚨 Version Requirements (Breaking)

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | 20.9+ | Node.js 18 no longer supported |
| **TypeScript** | 5.1+ | TypeScript 5.0 minimum |
| **Browsers** | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ | Updated minimum versions |

## 🚨 MUST-CHANGE APIs (Breaking Changes)

### 1. Async Request APIs
**Pages, Layouts, Route Handlers, generateMetadata, generateViewport**

```typescript
// ❌ BEFORE (Next.js 15)
export default function Page({ params, searchParams }) {
  const slug = params.slug
  const query = searchParams.q
}

export async function generateMetadata({ params }) {
  return { title: params.slug }
}

// ✅ AFTER (Next.js 16)
export default async function Page(props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const slug = params.slug
  const query = searchParams.q
}

export async function generateMetadata(props) {
  const params = await props.params
  return { title: params.slug }
}
```

**Route Handlers:**
```typescript
// ❌ BEFORE
export async function GET(request: Request, { params }) {
  const id = params.id
}

// ✅ AFTER
export async function GET(request: Request, props) {
  const params = await props.params
  const id = params.id
}
```

**Metadata Image Routes (opengraph-image, twitter-image, icon, apple-icon):**
```typescript
// ❌ BEFORE (Next.js 15)
export default function Image({ params, id }) {
  const slug = params.slug
  const imageId = id  // string
  // ...
}

export async function generateImageMetadata({ params }) {
  return [{ id: '1' }, { id: '2' }]
}

// ✅ AFTER (Next.js 16)
export default async function Image({ params, id }) {
  const resolvedParams = await params  // params is now a Promise
  const slug = resolvedParams.slug
  const imageId = id  // string (id itself is not a Promise)
  // ...
}

export async function generateImageMetadata({ params }) {
  const resolvedParams = await params  // params is now a Promise
  return [{ id: '1' }, { id: '2' }]
}
```

### 2. Async Dynamic Functions
**cookies(), headers(), draftMode()**

```typescript
// ❌ BEFORE
import { cookies, headers } from 'next/headers'

export default function Page() {
  const token = cookies().get('token')
  const ua = headers().get('user-agent')
}

// ✅ AFTER
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const token = (await cookies()).get('token')
  const ua = (await headers()).get('user-agent')
}
```

### 3. revalidateTag API Change
```typescript
// ❌ BEFORE
import { revalidateTag } from 'next/cache'
revalidateTag('posts')

// ✅ AFTER (use updateTag for immediate reads)
import { updateTag } from 'next/cache'
updateTag('posts', 'max')  // For Server Actions with read-your-own-writes

// OR use revalidateTag with profile
import { revalidateTag } from 'next/cache'
revalidateTag('posts', 'max')  // For background invalidation
```

## 🚫 Completely Removed Features

These features have been completely removed in Next.js 16:

### AMP Support
- **Removed:** `useAmp` hook, `export const config = { amp: true }`
- **Action:** Remove all AMP code. No replacement available.

### Runtime Config
- **Removed:** `serverRuntimeConfig`, `publicRuntimeConfig` from next.config.js
- **Action:** Use environment variables (`.env` files) instead

### PPR Flags
- **Removed:** `experimental.ppr` flag, `experimental_ppr` route export
- **Action:** Use `experimental.cacheComponents: true` instead

### experimental.dynamicIO
- **Renamed:** `experimental.dynamicIO` → `experimental.cacheComponents`
- **Action:** Update config to use new name

### unstable_rootParams()
- **Removed:** `unstable_rootParams()` API
- **Action:** Alternative API coming in upcoming minor. Use params from props temporarily

### Auto scroll-behavior
- **Removed:** Automatic `scroll-behavior: smooth` on HTML
- **Action:** Add `data-scroll-behavior="smooth"` to `<html>` tag if needed

### devIndicators Config Options
- **Removed:** `appIsrStatus`, `buildActivity`, `buildActivityPosition` options
- **Action:** Remove these options. The dev indicator itself remains

**📖 See `nextjs16://migration/examples` → "Removed Features Examples" for complete code examples**

## 🔍 Detection Rules (When to Make Functions Async)

**ONLY make async if the function uses these 5 APIs:**
1. `params` from props
2. `searchParams` from props
3. `cookies()` in body
4. `headers()` in body
5. `draftMode()` in body

**DO NOT make async:**
- `generateStaticParams()` - remains sync
- `robots()`, `sitemap()`, `manifest()` - only if they DON'T use the 5 APIs above
- Any function that doesn't access the 5 APIs

## ⚙️ Config Migrations

### 1. Turbopack Config Rename (REQUIRED for canary users)
- `turbopackPersistentCachingForDev` → `turbopackFileSystemCacheForDev`

### 2. ESLint Config Removal (REQUIRED)
- Remove `eslint` config object from next.config.js
- Move to `.eslintrc.json` or `eslint.config.js`

### 3. serverComponentsExternalPackages (BREAKING)
- Move from `experimental.serverComponentsExternalPackages` to top-level `serverComponentsExternalPackages`

**📖 See `nextjs16://migration/examples` → "Config Migration Examples" for complete code**

### 4. Image Defaults Changed (No Action Needed)
These changed automatically - override if needed:
- `minimumCacheTTL`: 60s → 14400s (4 hours)
- `qualities`: [1..100] → [75]
- `imageSizes`: removed `16` from default sizes
- `dangerouslyAllowLocalIP`: now `false` by default (blocks local IP optimization)
- `maximumRedirects`: unlimited → 3

## 🚫 Removed/Deprecated

### Segment Config (No Changes Required)
```typescript
// ℹ️ All segment configs continue to work in Next.js 16
export const dynamic = 'force-static'
export const fetchCache = '...'
export const revalidate = 60
export const dynamicParams = false
export const runtime = 'edge'

// No action needed for these configs during v16 upgrade
```

### API Renames
- `unstable_ViewTransition` → `ViewTransition` (now stable)
- Remove `experimental.viewTransition` flag from next.config.js

**📖 See `nextjs16://migration/examples` → "ViewTransition API Migration"**

### Middleware → Proxy Migration
**⚠️ Deprecated (still works with warnings)**

File renames:
- `middleware.ts` → `proxy.ts`
- Export `middleware` → `proxy`

Config property renames:
- `experimental.middlewarePrefetch` → `experimental.proxyPrefetch`
- `experimental.middlewareClientMaxBodySize` → `experimental.proxyClientMaxBodySize`
- `experimental.externalMiddlewareRewritesResolve` → `experimental.externalProxyRewritesResolve`
- `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`

**📖 See `nextjs16://migration/examples` → "Middleware to Proxy Examples"**

## 📁 Parallel Routes Requirement

All parallel route slots (e.g., `@modal`, `@auth`) **must** have `default.js` files:
- Required for non-leaf segments with routable children
- `@children` is special and does NOT need `default.js`

**📖 See `nextjs16://migration/examples` → "Parallel Routes Examples"**

## 🛡️ Image Security

If using local images with query strings, add `images.localPatterns` config.

**📖 See `nextjs16://migration/examples` → "Image Configuration Examples"**

## 🚀 Turbopack Improvements

**Default Bundler:**
- Turbopack is now default (remove `--turbopack` flags)
- Use `--webpack` flag if needed
- Automatically enables Babel if config found

**Config Rename (canary users):**
- `turbopackPersistentCachingForDev` → `turbopackFileSystemCacheForDev`

**📖 See `nextjs16://migration/examples` → "Config Migration Examples"**

## ℹ️ Additional Improvements (Automatic)

These improvements are automatic in Next.js 16:

- **Terminal Output:** Redesigned with clearer formatting and better error messages
- **Separate Output Dirs:** `next dev` and `next build` use separate directories (concurrent execution)
- **Lockfile Mechanism:** Prevents multiple instances on same project
- **Modern Sass:** `sass-loader` v16 with modern syntax support
- **ESLint Flat Config:** `@next/eslint-plugin-next` defaults to Flat Config format
- **Native TypeScript:** Use `--experimental-next-config-strip-types` for native TS in `next.config.ts`

## 🧪 Common Edge Cases

**Critical patterns:**
- ❌ Cannot destructure `params` in function signature (it's a Promise)
- ❌ Cannot nested destructure (e.g., `{ params: { slug } }`)
- ✅ Always `await props.params` before accessing
- ✅ Always await even in conditionals

**📖 See `nextjs16://migration/examples` → "Async API Migration Examples" for complete patterns**

## 📦 Dependencies

### TypeScript Type Definitions (REQUIRED if using TypeScript)

If you're using `@types/react` and `@types/react-dom`, upgrade them to the latest versions:

```bash
<package-manager> add -D @types/react@latest @types/react-dom@latest
```

**Why this matters:**
- Next.js 16 requires React 19+ type definitions
- Older `@types/react` versions will cause type errors with async components and request APIs
- The latest types include proper Promise types for `params` and `searchParams`

## 📝 Quick Checklist

**Version Requirements:**
- [ ] Node.js 20.9+
- [ ] TypeScript 5.1+ (if using TypeScript)
- [ ] Browser support: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+

**Completely Removed Features:**
- [ ] Remove AMP support (`useAmp`, `amp: true` config)
- [ ] Migrate `serverRuntimeConfig`/`publicRuntimeConfig` to environment variables
- [ ] Remove `experimental.ppr` flag and `experimental_ppr` exports
- [ ] Rename `experimental.dynamicIO` → `experimental.cacheComponents`
- [ ] Remove `unstable_rootParams()` usage
- [ ] Add `data-scroll-behavior="smooth"` if needed (no longer automatic)
- [ ] Remove `devIndicators` config options (appIsrStatus, buildActivity, buildActivityPosition)

**For every file with these patterns, make it async and await:**
- [ ] `function Page({ params })` → `async function Page(props)` + `await props.params`
- [ ] `function Page({ searchParams })` → `async function Page(props)` + `await props.searchParams`
- [ ] `function Layout({ params })` → `async function Layout(props)` + `await props.params`
- [ ] `generateMetadata({ params })` → `async generateMetadata(props)` + `await props.params`
- [ ] `generateViewport({ params })` → `async generateViewport(props)` + `await props.params`
- [ ] Metadata image routes: `function Image({ params, id })` → `async function Image({ params, id })` + `await params`
- [ ] `generateImageMetadata({ params })` → `async generateImageMetadata({ params })` + `await params`
- [ ] `cookies().get()` → `(await cookies()).get()`
- [ ] `headers().get()` → `(await headers()).get()`
- [ ] `draftMode().isEnabled` → `(await draftMode()).isEnabled`
- [ ] `revalidateTag(tag)` → `updateTag(tag, 'max')` or `revalidateTag(tag, 'max')`
- [ ] Add `default.tsx` for parallel route `@` folders with non-leaf segments (only when needed for routable children)
- [ ] Update `unstable_ViewTransition` → `ViewTransition` and remove `experimental.viewTransition` flag

**Dependencies:**
- [ ] Upgrade `@types/react` and `@types/react-dom` to latest (if using TypeScript)

**Config changes in next.config.js:**
- [ ] Remove `--turbopack` flags from scripts (now default; use `--webpack` for webpack)
- [ ] Rename `turbopackPersistentCachingForDev` → `turbopackFileSystemCacheForDev` (canary users)
- [ ] Remove `eslint` config object (move to .eslintrc.json or eslint.config.js)
- [ ] Move `serverComponentsExternalPackages` out of `experimental` to top-level
- [ ] Review image config defaults (if using local images with query strings)
- [ ] Rename middleware.ts → proxy.ts (deprecated, still works with warnings)
- [ ] Update middleware config properties to proxy equivalents

---

**For detailed examples and test patterns, load these resources:**
- `nextjs16://knowledge/request-apis` - Detailed async API patterns
- `nextjs16://knowledge/cache-invalidation` - updateTag vs revalidateTag semantics
- `nextjs16://knowledge/error-patterns` - Common build/runtime errors

(Resources use the `nextjs16://` URI scheme regardless of your MCP server name)
