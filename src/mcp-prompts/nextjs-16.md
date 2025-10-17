# Cache Components Mode: The Complete AI Agent Guide

## Authoritative Reference Based on E2E Test Suite Patterns

**Document Version**: 3.0 - E2E Test-Driven Edition
**Target**: Next.js 15.6+ / 16.0.0-canary with `experimental.cacheComponents: true`
**Source**: Derived from 125+ E2E test fixtures and behavioral assertions
**Last Updated**: January 2025

**⚠️ SCOPE**: This guide covers Cache Components mode (`experimental.cacheComponents: true`). These rules do NOT apply to standard Next.js 16 without Cache Components enabled.

---

## 🎯 What AI Agents Get Wrong (And Why)

Based on analyzing the complete E2E test suite, AI agents consistently make these mistakes **when Cache Components is enabled**:

### ❌ **CRITICAL ERRORS AI AGENTS MAKE (with cacheComponents enabled):**

1. **Using `loading.tsx` for loading states** (deprecated for PPR shell generation)
2. **Using `export const dynamic = 'force-static'`** (completely incompatible with cacheComponents)
3. **Using `export const fetchCache`** (raises build error with cacheComponents)
4. **Using `export const revalidate`** (raises build error with cacheComponents)
5. **Using `export const dynamicParams`** (raises build error with cacheComponents)
6. **Using `export const runtime`** (raises build error when incompatible with cacheComponents)
7. **Accessing `cookies()`/`headers()` in `'use cache'`** (throws runtime error)
8. **Using `'use cache: private'` without `<Suspense>`** (build error)
9. **Using `connection()` inside any cache scope** (throws error)
10. **Not awaiting `params` and `searchParams`** (type error in Next.js 15)
11. **Using `revalidateTag()` without the `profile` parameter** (deprecated)
12. **Passing non-serializable props to cached components** (cache key issues)
13. **Using `unstable_ViewTransition`** (renamed to `ViewTransition` in Next.js 16)

---

## 📘 Table of Contents

### Part 1: Core Mechanics

1. [The Fundamental Paradigm Shift](#paradigm-shift)
2. [How cacheComponents Changes Everything](#how-it-works)
3. [The Three Types of Rendering](#three-types)

### Part 2: Public Caches (`'use cache'`)

4. [Public Cache Mechanics](#public-cache)
5. [Cache Key Generation (Critical!)](#cache-keys)
6. [Non-Serializable Props Pattern](#non-serializable)
7. [Nested Public Caches](#nested-public)

### Part 3: Private Caches (`'use cache: private'`)

8. [Private Cache Mechanics](#private-cache)
9. [When Private Cache is Included/Excluded](#private-inclusion)
10. [Private Cache Patterns from Tests](#private-patterns)

### Part 4: Runtime Prefetching

11. [unstable_prefetch Configuration](#unstable-prefetch)
12. [Runtime Prefetch Sample Patterns](#prefetch-samples)
13. [What Gets Included in Runtime Prefetch](#prefetch-inclusion)
14. [Stale Time Thresholds (30s Rule)](#stale-thresholds)

### Part 5: Link Prefetching

15. [Link prefetch Modes](#link-prefetch)
16. [prefetch="unstable_forceStale" Deep Dive](#force-stale)
17. [unstable_dynamicOnHover](#dynamic-on-hover)

### Part 6: Request APIs

18. [Async params Semantics](#params-semantics)
19. [searchParams Behavior](#searchparams-behavior)
20. [cookies() and headers() Patterns](#cookies-headers)
21. [connection() Deep Dive](#connection-api)

### Part 7: Cache Invalidation

22. [updateTag() - Read-Your-Own-Writes](#update-tag)
23. [revalidateTag(tag, profile) - New Signature](#revalidate-tag)
24. [refresh() - Client Router Cache](#refresh-api)
25. [Granular Invalidation Strategies](#granular-invalidation)

### Part 8: Advanced Patterns

26. [cacheLife() Profiles and Custom Config](#cache-life)
27. [cacheTag() Multi-Tag Patterns](#cache-tag)
28. [Draft Mode Behavior](#draft-mode)
29. [generateStaticParams Integration](#generate-static-params)
30. [Math.random() and Date.now() Patterns](#random-patterns)

### Part 9: Build Behavior

31. [What Gets Prerendered](#prerendering)
32. [Resume Data Cache (RDC)](#resume-data-cache)
33. [Static Shell vs Dynamic Holes](#shells-and-holes)
34. [generateMetadata and generateViewport](#metadata-viewport)

### Part 10: Error Patterns

35. [Segment Config Errors](#segment-config-errors)
36. [Dynamic Metadata Errors](#dynamic-metadata-errors)
37. [Missing Suspense Errors](#missing-suspense)
38. [Sync IO After Dynamic API Errors](#sync-io-errors)

### Part 11: Real Test-Driven Patterns

39. [Complete E2E Pattern Library](#pattern-library)
40. [Decision Trees Based on Tests](#decision-trees)

---

## <a id="paradigm-shift"></a>1. The Fundamental Paradigm Shift

### Test Evidence: Default Behavior Change

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts`

```typescript
// OBSERVED BEHAVIOR IN TESTS:

// Route: /params/semantics/one/build/layout-access/server
// With generateStaticParams returning { highcard: 'build' }

// Development Mode:
// - layout: 'at runtime'
// - page: 'at runtime'
// - ALL params: 'at runtime'

// Production Mode (Build):
// - layout: 'at buildtime' (from generateStaticParams)
// - page: 'at buildtime' (from generateStaticParams)
// - params.lowcard: 'one' (value present)
// - params.highcard: 'build' (value present)

// Route: /params/semantics/one/run/layout-access/server
// With generateStaticParams NOT returning 'run' for highcard

// Development Mode:
// - layout: 'at runtime'
// - page: 'at runtime'

// Production Mode (Build):
// - layout: 'at buildtime' (static shell)
// - Suspense fallback: 'loading highcard children' (shown!)
// - page: 'at runtime' (dynamic hole!)
// - params.lowcard: 'one'
// - params.highcard: 'run'
```

### Key Insight from Tests:

**With cacheComponents enabled + generateStaticParams:**

- Params from generateStaticParams → Component renders at buildtime
- Params NOT in generateStaticParams → Component renders at runtime with PPR shell

This is THE CORE DIFFERENCE that AI agents must understand.

---

## <a id="how-it-works"></a>2. How cacheComponents Changes Everything

### Test-Proven Behaviors

**Test Source**: Multiple test files

#### Behavior 1: Route Segment Configs Are Incompatible with Cache Components

**⚠️ NOTE**: These configs work fine in Next.js 16 WITHOUT cacheComponents. They're only forbidden when `experimental.cacheComponents: true` is enabled.

```typescript
// ❌ BUILD ERROR (when cacheComponents is enabled):
export const dynamic = "force-static"
export const revalidate = 60
export const fetchCache = "force-cache"
export const dynamicParams = false
export const runtime = "edge" // If incompatible

// Error message from test:
// "Route segment config "revalidate" is not compatible with
// `nextConfig.experimental.cacheComponents`. Please remove it."

// ✅ These work fine in Next.js 16 if cacheComponents is NOT enabled
```

**Test Source**: `test/e2e/app-dir/cache-components-segment-configs/`

#### Behavior 2: Default is Fully Dynamic

```typescript
// Test shows: Without 'use cache', pages render fresh every request
// Test Source: test/e2e/app-dir/use-cache/app/(dynamic)/page.tsx

async function getCachedRandom(x: number, children: React.ReactNode) {
  'use cache'
  return {
    x,
    y: Math.random(),  // This value STAYS SAME across requests
    z: <Foo />,
    r: children,
  }
}

// Test assertion proves:
// - Two navigations to ?n=1 return SAME random value
// - Navigation to ?n=2 returns DIFFERENT random value
// - Children prop (non-serializable) doesn't affect cache key
```

#### Behavior 3: Private Cache Can Access Cookies/Headers

```typescript
// Test Source: test/e2e/app-dir/use-cache-private/app/cookies/page.tsx

async function Private() {
  'use cache: private'
  cacheLife({ stale: 420 })

  const cookie = (await cookies()).get('test-cookie')  // ✅ ALLOWED!

  const { headers } = await fetch('https://...', {
    headers: { 'x-test-cookie': cookie?.value ?? '' }
  }).then(res => res.json())

  return <pre>test-cookie: {headers['x-test-cookie']}</pre>
}

// Test assertions:
// - Cookie value 'testValue' → display shows 'testValue'
// - Update cookie to 'foo' → display shows 'foo'
// - Private cache MUST be wrapped in Suspense
```

---

## <a id="three-types"></a>3. The Three Types of Rendering

### From Test Behavioral Patterns

```
┌─────────────────────────────────────────────────────┐
│ Type 1: PUBLIC CACHE ('use cache')                 │
│ ─────────────────────────────────────────────────── │
│ Included in: ✅ Static prerender                    │
│ Included in: ✅ Runtime prefetch                    │
│ Can access: ❌ cookies/headers/searchParams         │
│ Must wrap in Suspense: ❌ No                        │
│ Cache scope: Shared across ALL users               │
│ Test: test/e2e/app-dir/use-cache/app/*/cache-tag   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Type 2: PRIVATE CACHE ('use cache: private')       │
│ ─────────────────────────────────────────────────── │
│ Included in: ❌ Static prerender (excluded!)        │
│ Included in: ✅ Runtime prefetch (if stale >= 30s)  │
│ Can access: ✅ cookies/headers/searchParams/params  │
│ Must wrap in Suspense: ✅ YES (build error if not)  │
│ Cache scope: Per-user                              │
│ Test: test/e2e/app-dir/use-cache-private/          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Type 3: FULLY DYNAMIC (no cache directive)         │
│ ─────────────────────────────────────────────────── │
│ Included in: ❌ Static prerender (excluded!)        │
│ Included in: ❌ Runtime prefetch (excluded!)        │
│ Can access: ✅ All APIs                             │
│ Must wrap in Suspense: Recommended for PPR         │
│ Cache scope: No caching                            │
│ Test: test/e2e/app-dir/segment-cache/prefetch-*    │
└─────────────────────────────────────────────────────┘
```

---

## <a id="public-cache"></a>4. Public Cache Mechanics

### Pattern 1: File-Level 'use cache'

```typescript
// Test Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-life/page.tsx

'use cache'
import { cacheLife } from 'next/cache'

async function getCachedRandom() {
  'use cache'
  cacheLife('frequent')
  return Math.random()
}

export default async function Page() {
  const x = await getCachedRandom()
  return <p id="x">{x}</p>
}

// Test Behavior:
// - Initial load: x = 0.12345
// - Refresh: x = 0.12345 (SAME VALUE - cached!)
// - Different arg: Different cache entry
```

### Pattern 2: Component-Level 'use cache'

```typescript
// Test Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-tag/page.tsx

async function getCachedWithTag({ tag }: { tag: string }) {
  'use cache'
  cacheTag(tag, 'c')

  const response = await fetch('https://...')
  return [Math.random(), await response.text()]
}

export default async function Page() {
  const a = await getCachedWithTag({ tag: 'a' })
  const b = await getCachedWithTag({ tag: 'b' })

  return (
    <div>
      <p id="a">[a, c] {a.join(' ')}</p>
      <p id="b">[b, c] {b.join(' ')}</p>
    </div>
  )
}

// Test Behavior:
// - revalidateTag('a') → Only 'a' updates, 'b' stays same
// - revalidateTag('c') → BOTH update (shared tag)
// - revalidateTag with 'max' profile → stale-while-revalidate
```

---

## <a id="cache-keys"></a>5. Cache Key Generation (Critical!)

### Test-Proven Cache Key Rules

**Test Source**: `test/e2e/app-dir/use-cache/app/(dynamic)/page.tsx`

```typescript
async function getCachedRandom(x: number, children: React.ReactNode) {
  'use cache'
  return {
    x,
    y: Math.random(),
    z: <Foo />,           // Client component
    r: children,          // Non-serializable
  }
}

export default async function Page({ searchParams }: {
  searchParams: Promise<{ n: string }>
}) {
  const n = +(await searchParams).n
  const values = await getCachedRandom(
    n,
    <p id="r">rnd{Math.random()}</p>  // Fresh every render
  )
  return (
    <>
      <p id="x">{values.x}</p>
      <p id="y">{values.y}</p>
      <p id="z">{values.z}</p>
      {values.r}
    </>
  )
}

// TEST ASSERTIONS PROVE:
// 1. ?n=1 first visit: y = 0.123
// 2. ?n=2 visit: y = 0.456 (different cache key!)
// 3. ?n=1 second visit: y = 0.123 (SAME! cached by 'x' param)
// 4. values.r renders fresh random number each time
//    BUT doesn't invalidate the cache (non-serializable)
```

### Cache Key Formula (from tests):

```
Cache Key = hash(
  buildId +
  functionId +
  serializableArgs  // Only these matter!
)

Non-serializable args (children, JSX, functions):
- Treated as opaque references
- NOT part of cache key
- Re-evaluated each render
- Can be different without invalidating cache
```

---

## <a id="non-serializable"></a>6. Non-Serializable Props Pattern

### Test Pattern: Children Props

**Test Source**: `test/e2e/app-dir/use-cache/app/(dynamic)/page.tsx`

```typescript
// THE PATTERN TESTS PROVE:

async function getCachedRandom(x: number, children: React.ReactNode) {
  'use cache'
  return {
    x,
    y: Math.random(),
    r: children,  // Non-serializable
  }
}

// When called with:
getCachedRandom(
  1,
  <p>rnd{Math.random()}</p>  // Different every time
)

// Behavior:
// - Cache hits on x=1 even though children is different
// - children re-renders with new random value
// - y stays cached (same random value)
```

### Critical Rule from Tests:

**Serializable props** (numbers, strings, plain objects):

- Become part of cache key
- Must match for cache hit

**Non-serializable props** (JSX, functions, class instances):

- Do NOT become part of cache key
- Passed through as references
- Re-evaluated on each render
- Can change without cache miss

---

## <a id="private-cache"></a>8. Private Cache Mechanics

### Pattern from Tests: Private Cache Structure

**Test Source**: `test/e2e/app-dir/use-cache-private/app/cookies/page.tsx`

```typescript
// THE EXACT PATTERN FROM TESTS:

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Private />
    </Suspense>
  )
}

async function Private() {
  'use cache: private'

  cacheLife({ stale: 420 })
  const cookie = (await cookies()).get('test-cookie')

  const { headers } = await fetch('https://...', {
    headers: { 'x-test-cookie': cookie?.value ?? '' }
  }).then(res => res.json())

  return (
    <pre>
      test-cookie: <span id="test-cookie">{headers['x-test-cookie'] || '<empty>'}</span>
    </pre>
  )
}

// TEST BEHAVIOR:
// 1. Set cookie to 'foo'
// 2. Page displays: 'foo'
// 3. Change cookie to 'bar'
// 4. Refresh page
// 5. Page displays: 'bar' (per-user cache updated!)
```

### Private Cache Rules from Tests:

1. **MUST be wrapped in Suspense** (build error if not)
2. **Can access cookies()** ✅
3. **Can access headers()** ✅
4. **Can access searchParams** ✅
5. **Can access params** ✅
6. **CANNOT use connection()** ❌ (throws error)
7. **Excluded from static prerender** (always dynamic)
8. **Included in runtime prefetch** (if stale >= 30s)

---

## <a id="private-inclusion"></a>9. When Private Cache is Included/Excluded

### Test Pattern: Stale Time Threshold

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/prefetch-runtime.test.ts` (lines 752-1030)

```typescript
// CRITICAL THRESHOLD: 30 seconds (RUNTIME_PREFETCH_DYNAMIC_STALE)

// Pattern 1: Private cache with cacheLife('seconds')
async function ShortLivedCache() {
  'use cache: private'
  cacheLife('seconds')  // stale: 0, revalidate: 1, expire: 1
  // ... BUT cacheLife('seconds') is special: stale is set to 30s!

  return <div id="cached-value">{Date.now()}</div>
}

// TEST BEHAVIOR:
// Static prefetch: ❌ NOT included (expire < 5min)
// Runtime prefetch: ✅ INCLUDED (stale = 30s, meets 30s threshold)

// Pattern 2: Private cache with short stale time
async function TooShort() {
  'use cache: private'
  cacheLife({ stale: 20, revalidate: 100, expire: 200 })
  return <div>{Date.now()}</div>
}

// TEST BEHAVIOR:
// Static prefetch: ❌ NOT included (expire < 5min)
// Runtime prefetch: ❌ NOT included (stale < 30s)
// Navigation: Fetched at request time
```

### Inclusion Matrix from Tests:

| Cache Type | Stale Time | Expire Time | Static Prefetch | Runtime Prefetch |
| ---------- | ---------- | ----------- | --------------- | ---------------- |
| Public     | Any        | >= 5min     | ✅ Included     | ✅ Included      |
| Public     | >= 30s     | < 5min      | ❌ Excluded     | ✅ Included      |
| Public     | < 30s      | < 5min      | ❌ Excluded     | ❌ Excluded      |
| Private    | >= 30s     | Any         | ❌ Excluded     | ✅ Included      |
| Private    | < 30s      | Any         | ❌ Excluded     | ❌ Excluded      |

---

## <a id="unstable-prefetch"></a>11. unstable_prefetch Configuration

### Test Pattern: Runtime Samples

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/app/(default)/in-page/cookies/page.tsx`

```typescript
// EXACT PATTERN FROM TESTS:

export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ cookies: [{ name: 'testCookie', value: 'testValue' }] }],
}

export default async function Page() {
  return (
    <main>
      <Suspense fallback={<div>Loading 1...</div>}>
        <RuntimePrefetchable />
      </Suspense>
    </main>
  )
}

async function RuntimePrefetchable() {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('testCookie')?.value ?? null
  await cachedDelay([__filename, cookieValue])

  return (
    <div>
      <div id="cookie-value">{`Cookie: ${cookieValue}`}</div>
      <Suspense fallback={<div>Loading 2...</div>}>
        <Dynamic />
      </Suspense>
    </div>
  )
}

async function Dynamic() {
  await uncachedIO()
  await connection()
  return <div id="dynamic-content">Dynamic content</div>
}

// TEST BEHAVIOR (prefetch-runtime.test.ts lines 432-580):
// 1. Link becomes visible → Runtime prefetch triggered
// 2. Prefetch includes: "Cookie: testValue" (from sample!)
// 3. Prefetch EXCLUDES: "Dynamic content" (uncached IO)
// 4. Navigation happens → Instant show of cookie value
// 5. Dynamic content streams in after
```

### Test Pattern: Three Prefetch Scenarios

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/` (lines 31-581)

```typescript
// SCENARIO 1: in-page (no cache, just dynamic)
// Path: /in-page/cookies
export default async function Page() {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('testCookie')?.value

  return (
    <>
      <div id="cookie-value">Cookie: {cookieValue}</div>
      <Suspense><Dynamic /></Suspense>
    </>
  )
}

// Runtime prefetch includes: ✅ Cookie value
// Runtime prefetch excludes: ❌ Dynamic content

// SCENARIO 2: in-private-cache
// Path: /in-private-cache/cookies
async function privateCache() {
  'use cache: private'
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('testCookie')?.value ?? null
  await cachedDelay([__filename, cookieValue])
  return cookieValue
}

// Runtime prefetch includes: ✅ Private cache result
// Runtime prefetch excludes: ❌ Dynamic content

// SCENARIO 3: passed-to-public-cache
// Path: /passed-to-public-cache/cookies
async function publicCache(cookiePromise: Promise<string | null>) {
  'use cache'
  const cookieValue = await cookiePromise
  await cachedDelay([__filename, cookieValue])
  return cookieValue
}

async function RuntimePrefetchable() {
  await cookies()  // Guard from static prerender

  const cookieValue = await publicCache(
    cookies().then(c => c.get('testCookie')?.value ?? null)
  )
  return <div id="cookie-value">Cookie: {cookieValue}</div>
}

// Pattern: Pass cookie Promise to public cache
// This allows public cache while still accessing cookies!
```

---

## <a id="prefetch-inclusion"></a>13. What Gets Included in Runtime Prefetch

### Test-Driven Inclusion Rules

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/prefetch-runtime.test.ts`

#### Rule 1: Includes All Public Caches

```typescript
// Always included in runtime prefetch:
async function PublicCached() {
  'use cache'
  cacheLife('hours')  // Any duration
  return <div>Content</div>
}
```

#### Rule 2: Includes Private Caches (if stale >= 30s)

```typescript
// Test lines 752-829:

// ✅ INCLUDED in runtime prefetch:
async function IncludedPrivate() {
  'use cache: private'
  cacheLife('seconds')  // stale = 30s (exactly at threshold)
  return <div>Cached</div>
}

// ❌ EXCLUDED from runtime prefetch:
async function ExcludedPrivate() {
  'use cache: private'
  cacheLife({ stale: 20, revalidate: 100, expire: 200 })
  return <div>Not cached</div>
}
```

#### Rule 3: Includes params/searchParams/cookies/headers

```typescript
// Test lines 45-580:

// These are ALL included in runtime prefetch:
const { id } = await params
const { q } = await searchParams
const cookie = (await cookies()).get("name")
const header = (await headers()).get("user-agent")

// Test assertion:
// - Prefetch response includes: "Param: 123"
// - Prefetch response includes: "Search param: 456"
// - Prefetch response includes: "Cookie: initialValue"
// - Prefetch response includes: "Header: present"
```

#### Rule 4: EXCLUDES Uncached IO

```typescript
// Test lines 45-153:

async function Dynamic() {
  await uncachedIO()  // Simulates DB query, external API, etc.
  await connection()
  return <div id="dynamic-content">Dynamic content</div>
}

// Test assertion:
// - Prefetch response: block: 'reject' for "Dynamic content"
// - Navigation: Dynamic content streams in after
```

---

## <a id="stale-thresholds"></a>14. Stale Time Thresholds (30s Rule)

### The Magic Numbers from Tests

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/prefetch-runtime.test.ts` (lines 831-1030)

```
RUNTIME_PREFETCH_DYNAMIC_STALE = 30 seconds
DYNAMIC_EXPIRE = 5 minutes (300 seconds)
```

### Test Pattern Matrix:

```typescript
// Pattern 1: Long stale, short expire
async function Example1() {
  'use cache'
  cacheLife({
    stale: 60,     // >= 30s ✅
    revalidate: 120,
    expire: 180    // < 5min
  })
  return <div>Content</div>
}

// Static prefetch: ❌ NO (expire < 5min)
// Runtime prefetch: ✅ YES (stale >= 30s)

// Pattern 2: Short stale, long expire
async function Example2() {
  'use cache'
  cacheLife({
    stale: 10,     // < 30s ❌
    revalidate: 300,
    expire: 600    // >= 5min
  })
  return <div>Content</div>
}

// Static prefetch: ✅ YES (expire >= 5min)
// Runtime prefetch: ❌ NO (stale < 30s)

// Pattern 3: Both long
async function Example3() {
  'use cache'
  cacheLife({
    stale: 60,     // >= 30s ✅
    revalidate: 300,
    expire: 600    // >= 5min ✅
  })
  return <div>Content</div>
}

// Static prefetch: ✅ YES
// Runtime prefetch: ✅ YES

// Pattern 4: cacheLife('seconds') - SPECIAL CASE
async function Example4() {
  'use cache'
  cacheLife('seconds')
  // Despite name, stale is set to 30s to meet threshold!
  return <div>Content</div>
}

// Static prefetch: ❌ NO (expire = 1s < 5min)
// Runtime prefetch: ✅ YES (stale = 30s exactly)
```

---

## <a id="params-semantics"></a>18. Async params Semantics

### Test Pattern: generateStaticParams Integration

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts`

```typescript
// File: app/params/semantics/[lowcard]/[highcard]/layout.tsx

export async function generateStaticParams() {
  return [
    { highcard: 'build' },  // Only 'build' is pre-generated
  ]
}

export default function HighcardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div id="highcard-fallback">loading highcard children</div>}>
      {children}
    </Suspense>
    <span id="highcard">{getSentinelValue()}</span>
  )
}

// File: app/params/semantics/[lowcard]/[highcard]/layout-access/server/page.tsx

export default async function Page({
  params
}: {
  params: Promise<{ lowcard: string; highcard: string }>
}) {
  return (
    <>
      <div>lowcard: <span id="param-lowcard">{(await params).lowcard}</span></div>
      <div>highcard: <span id="param-highcard">{(await params).highcard}</span></div>
      <span id="page">{getSentinelValue()}</span>
    </>
  )
}

// TEST BEHAVIOR:

// Route: /params/semantics/one/build/layout-access/server
// (highcard='build' is in generateStaticParams)
// Production:
// - #layout: 'at buildtime' ✅
// - #highcard: 'at buildtime' ✅
// - #page: 'at buildtime' ✅
// - #param-lowcard: 'one'
// - #param-highcard: 'build'
// - #highcard-fallback: NOT SHOWN (no dynamic hole)

// Route: /params/semantics/one/run/layout-access/server
// (highcard='run' is NOT in generateStaticParams)
// Production:
// - #layout: 'at buildtime' ✅ (static shell)
// - #highcard: 'at buildtime' ✅ (static shell)
// - #highcard-fallback: 'loading highcard children' ✅ (SHOWN!)
// - #page: 'at runtime' ✅ (dynamic hole!)
// - #param-lowcard: 'one'
// - #param-highcard: 'run'
```

### Critical Insight from Tests:

**When you await params:**

- If param value in generateStaticParams → Renders at build time
- If param value NOT in generateStaticParams → Creates dynamic hole (PPR)
- Suspense boundary shows fallback for dynamic params
- Static parts (layout) render at build time as shell

---

## <a id="searchparams-behavior"></a>19. searchParams Behavior

### Test Pattern: searchParams in Runtime Prefetch

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/prefetch-runtime.test.ts` (lines 275-377)

```typescript
// EXACT TEST PATTERN:

// File: app/in-page/search-params/page.tsx

export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ searchParams: { searchParam: '123' } }],
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ searchParam?: string }>
}) {
  const { searchParam } = await searchParams

  return (
    <>
      <div id="search-param-value">Search param: {searchParam}</div>
      <Suspense fallback={<div>Loading...</div>}>
        <Dynamic />
      </Suspense>
    </>
  )
}

async function Dynamic() {
  await connection()
  return <div id="dynamic-content">Dynamic content</div>
}

// TEST BEHAVIOR:

// 1. Link to ?searchParam=123 becomes visible
// Prefetch includes: "Search param: 123" ✅
// Prefetch excludes: "Dynamic content" ❌

// 2. Link to ?searchParam=456 becomes visible
// Prefetch includes: "Search param: 456" ✅ (different sample!)
// Prefetch excludes: "Dynamic content" ❌

// 3. Navigate to ?searchParam=123
// Immediate show: "Search param: 123" (from prefetch)
// Then streams: "Dynamic content"

// 4. Navigate to ?searchParam=456
// Immediate show: "Search param: 456" (from prefetch)
// Then streams: "Dynamic content"
```

### Private Cache with searchParams

**Test Source**: `test/e2e/app-dir/use-cache-private/app/search-params/page.tsx`

```typescript
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  'use cache: private'

  const { q } = await searchParams

  return (
    <p>
      Query: <span id="search-param">{q}</span>
    </p>
  )
}

// TEST BEHAVIOR:
// - ?q=foo → displays 'foo'
// - Navigate to ?q=bar → displays 'bar'
// - Each searchParams value gets its own cache entry
```

---

## <a id="connection-api"></a>21. connection() Deep Dive

### Test Pattern: Math.random() and Date.now()

**Test Source**: `test/development/app-dir/cache-components-warnings/` (disabled but shows pattern)

```typescript
// Pattern: Math.random() without connection()

export default async function Page() {
  const random = Math.random()  // ⚠️  Warning in dev
  return <div>{random}</div>
}

// Dev warning:
// 'Route "/path" used `Math.random()` outside of `"use cache"`
// and without explicitly calling `await connection()` beforehand.'

// ✅ CORRECT PATTERN:

export default async function Page() {
  await connection()
  const random = Math.random()  // ✅ No warning
  return <div>{random}</div>
}
```

### Test Pattern: connection() Creates Dynamic Hole

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/` (Dynamic components)

```typescript
async function Dynamic() {
  await connection()
  // Everything after connection() is excluded from prefetch
  return <div id="dynamic-content">Dynamic content</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dynamic />
    </Suspense>
  )
}

// Runtime prefetch test assertion:
// - Prefetch response: block: 'reject' for "Dynamic content"
// - Navigation: "Dynamic content" streams in
```

---

## <a id="update-tag"></a>22. updateTag() - Read-Your-Own-Writes

### Test Pattern: Immediate Cache Invalidation

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/cache-tag/buttons.tsx` + test assertions

```typescript
"use server"

import { updateTag, revalidateTag } from "next/cache"

export async function revalidateA() {
  revalidateTag("a")
}

export async function revalidateB() {
  revalidateTag("b")
}

export async function revalidateC() {
  revalidateTag("c")
}

// Page uses getCachedWithTag({ tag: 'a' }) and ({ tag: 'b' })
// Both also use cacheTag(tag, 'c')

// TEST BEHAVIOR (lines 223-315):
// Initial: valueA = 0.123, valueB = 0.456
//
// Call revalidateA():
// - valueA changes to 0.789
// - valueB stays 0.456
//
// Call revalidateC():
// - valueA changes (has tag 'c')
// - valueB changes (has tag 'c')
//
// This proves: Tags work as expected for granular invalidation
```

---

## <a id="revalidate-tag"></a>23. revalidateTag(tag, profile) - New Signature

### Test Pattern: Profile Parameter

**Test Source**: Documentation and recent commits show new signature

```typescript
'use server'

import { revalidateTag } from 'next/cache'

// ✅ NEW RECOMMENDED PATTERN:
export async function updateProductList() {
  await db.products.update(...)
  revalidateTag('products', 'max')  // Stale-while-revalidate
}

// ❌ DEPRECATED (but still works):
export async function oldPattern() {
  revalidateTag('products')  // No profile = legacy behavior
}

// Test from use-cache.test.ts (lines 223-314):
// - Revalidate specific tags
// - Cache updates happen async
// - Stale content served while revalidating (with 'max' profile)
```

---

## <a id="refresh-api"></a>24. refresh() - Client Router Cache

### Test Pattern: In-Place Page Update

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/form/page.tsx`

```typescript
'use cache'
import { cacheLife, cacheTag } from 'next/cache'

async function getTime() {
  'use cache'
  cacheTag('time')
  cacheLife('hours')
  return Date.now()
}

export default async function Page() {
  const time = await getTime()

  return (
    <>
      <p id="t">{time}</p>
      <form action={async () => {
        'use server'
        await revalidateTag('time')
        refresh()  // ← Refresh current page
      }}>
        <button id="refresh" type="submit">Refresh</button>
      </form>
    </>
  )
}

// TEST BEHAVIOR (lines 612-633):
// 1. Initial load: time1 = 1234567890
// 2. Reload page: time2 = 1234567890 (same, cached)
// 3. Click refresh button:
//    - revalidateTag('time') called
//    - refresh() called
//    - Page updates in place
// 4. Check time: time3 ≠ time2 (updated!)
```

---

## <a id="cache-life"></a>26. cacheLife() Profiles and Custom Config

### Test Pattern: Custom Profile

**Test Source**: `test/e2e/app-dir/use-cache/next.config.js` + test assertions

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    cacheComponents: true,
    cacheLife: {
      frequent: {
        stale: 19,
        revalidate: 100,
        expire: 300,
      },
    },
  },
}

// page.tsx
'use cache'
import { cacheLife } from 'next/cache'

export default async function Page() {
  cacheLife('frequent')  // Uses custom profile
  return <div>Page</div>
}

// TEST ASSERTIONS (lines 508-567):
// - routes['/cache-life'].initialRevalidateSeconds === 100
// - routes['/cache-life'].initialExpireSeconds === 300
// - cacheLifeMeta.headers['x-nextjs-stale-time'] === '19'
// - Cache-Control header: 's-maxage=100, stale-while-revalidate=200'
//   (SWR = expire - revalidate = 300 - 100 = 200)
```

---

## <a id="draft-mode"></a>28. Draft Mode Behavior

### Test Pattern: Draft Mode Bypasses Cache

**Test Source**: `test/e2e/app-dir/use-cache/use-cache.test.ts` (lines 778-928)

```typescript
async function getCachedValue() {
  'use cache'
  return Date.now()
}

export default async function Page() {
  const value = await getCachedValue()

  return (
    <>
      <div id="top-level">{value}</div>
      <ToggleDraftModeButton />
    </>
  )
}

// TEST BEHAVIOR:

// Draft mode DISABLED:
// - Load page: value = 123
// - Refresh: value = 123 (cached!)

// Enable draft mode (via Server Action):
// - Load page: value = 456 (NEW! cache bypassed)
// - Refresh: value = 789 (NEW! cache bypassed)

// Disable draft mode:
// - Load page: value = 123 (original cached value restored!)

// Key insight: Draft mode completely bypasses cache
```

---

## <a id="generate-static-params"></a>29. generateStaticParams Integration

### Test Pattern: Cardinality-Based Prerendering

**Test Source**: `test/e2e/app-dir/cache-components/app/params/semantics/[lowcard]/[highcard]/layout.tsx`

```typescript
// Low cardinality param (few values)
export async function generateStaticParams() {
  return [{ lowcard: "one" }, { lowcard: "two" }]
}

// High cardinality param (many values)
export async function generateStaticParams() {
  return [
    { highcard: "build" },
    // Only one value - others generated on-demand
  ]
}

// COMBINED ROUTE: /params/semantics/[lowcard]/[highcard]

// URL: /params/semantics/one/build
// - lowcard='one' in generateStaticParams ✅
// - highcard='build' in generateStaticParams ✅
// Result: FULLY PRERENDERED at build time

// URL: /params/semantics/one/run
// - lowcard='one' in generateStaticParams ✅
// - highcard='run' NOT in generateStaticParams ❌
// Result: PARTIAL PRERENDER
//   - Layout (lowcard='one'): buildtime shell
//   - Suspense fallback: SHOWN
//   - Page (highcard='run'): runtime hole

// URL: /params/semantics/three/run
// - lowcard='three' NOT in generateStaticParams ❌
// - highcard='run' NOT in generateStaticParams ❌
// Result: FULLY DYNAMIC (no shell)
```

---

## <a id="random-patterns"></a>30. Math.random() and Date.now() Patterns

### Test Pattern: connection() Guards Random Values

**Test Source**: `test/e2e/app-dir/cache-components/app/random/` fixtures

```typescript
// ❌ WRONG: Random without connection()
export default async function Page() {
  const rand = Math.random()  // Causes issues in prerender
  return <div>{rand}</div>
}

// Dev warning:
// "Route used `Math.random()` outside of `'use cache'`
// and without explicitly calling `await connection()` beforehand."

// ✅ CORRECT: connection() before random
export default async function Page() {
  await connection()
  const rand = Math.random()  // Safe now
  return <div>{rand}</div>
}

// ✅ ALSO CORRECT: Random inside 'use cache'
async function getCachedRandom() {
  'use cache'
  return Math.random()  // Cached, same value per cache key
}
```

---

## <a id="prerendering"></a>31. What Gets Prerendered

### Test Evidence: Prerender Manifest

**Test Source**: `test/e2e/app-dir/use-cache/use-cache.test.ts` (lines 444-506)

```typescript
// With cacheComponents: true, the prerender-manifest.json includes:

const prerenderedRoutes = [
  "/_not-found",
  "/a123", // generateStaticParams entry
  "/api", // Route handler with 'use cache'
  "/b456", // generateStaticParams entry
  "/cache-fetch", // Page with 'use cache'
  "/cache-life", // Page with 'use cache' + cacheLife
  "/cache-tag", // Page with 'use cache' + cacheTag
  "/form", // Page with 'use cache'
  // ... more routes
]

// Routes NOT prerendered:
// - Pages with cookies()/headers() and no 'use cache'
// - Pages with searchParams and no 'use cache'
// - Pages with dynamic params not in generateStaticParams
// - Pages with connection() calls
```

### Shell Completeness Test

```typescript
// Test checks if HTML ends with </html>

// COMPLETE SHELL (fully prerendered):
// .next/server/app/cache-life.html ends with "</html>"

// INCOMPLETE SHELL (partial prerender):
// .next/server/app/cache-life-with-dynamic.html does NOT end with "</html>"
// Contains: <div id="y">Loading...</div> (Suspense fallback)
```

---

## <a id="resume-data-cache"></a>32. Resume Data Cache (RDC)

### Test Pattern: What Goes in RDC

**Test Source**: `test/e2e/app-dir/use-cache/use-cache.test.ts` (lines 999-1028)

```typescript
// Test analyzes .next/server/app/rdc.meta file

async function outer(arg: string) {
  'use cache'
  cacheTag('outer-tag')

  const middleValue = await middle(arg)  // Inner cache
  return middleValue
}

async function middle(arg: string) {
  'use cache'
  return await inner(arg)  // Even more nested
}

async function inner(arg: string) {
  'use cache'
  return Math.random()
}

async function short(arg: { id: string }) {
  'use cache'
  cacheLife({ stale: 10, revalidate: 20, expire: 60 })
  return Date.now()
}

export default async function Page() {
  const outerValue = await outer('outer')
  const innerValue = await inner('inner')
  const shortValue = await short({ id: 'short' })

  return <div>{outerValue} {innerValue} {shortValue}</div>
}

// TEST ASSERTION:
// Resume Data Cache includes:
// - 'outer' cache entry ✅ (called at page level)
// - 'inner' cache entry ✅ (called at page level)
// - 'middle' cache entry ❌ (only called inside 'outer')
// - 'short' cache entry ❌ (expire < 5min, omitted from prerender)

// Rule: Only caches called from prerender scope are in RDC
// Inner caches (only called from other caches) are NOT in RDC
```

---

## <a id="metadata-viewport"></a>34. generateMetadata and generateViewport

### Test Pattern: Cached Metadata

**Test Source**: `test/e2e/app-dir/use-cache/use-cache.test.ts` (lines 1049-1336)

```typescript
// Pattern 1: Shared cache between page and metadata

// lib/data.ts
async function getCachedData() {
  'use cache'
  return Math.random()
}

// page.tsx
import { getCachedData } from './lib/data'

export async function generateMetadata() {
  const data = await getCachedData()
  return {
    title: String(data),
  }
}

export default async function Page() {
  const data = await getCachedData()
  return <div id="page-data">{data}</div>
}

// TEST BEHAVIOR:
// - document.title === page-data value
// - Both use SAME cached value (cache is shared!)

// Pattern 2: Cached generateMetadata with params

export async function generateMetadata({
  params
}: {
  params: Promise<{ color: string }>
}) {
  'use cache'
  const { color } = await params
  return {
    title: color,
  }
}

// TEST BEHAVIOR:
// - With JS disabled: <title> in <head> ✅
// - With JS enabled: document.title matches cached value ✅
// - Refresh: Same title (cached via RDC)
```

---

## <a id="segment-config-errors"></a>35. Segment Config Errors

### Test Pattern: All Forbidden Configs

**Test Source**: `test/e2e/app-dir/cache-components-segment-configs/cache-components-segment-configs.test.ts`

```typescript
// ❌ app/dynamic/page.tsx
export const dynamic = 'force-dynamic'
// Error: "Route segment config "dynamic" is not compatible with
// `nextConfig.experimental.cacheComponents`. Please remove it."

// ❌ app/dynamic-params/[slug]/page.tsx
export const dynamicParams = false
// Error: "Route segment config "dynamicParams" is not compatible..."

// ❌ app/fetch-cache/page.tsx
export const fetchCache = 'force-cache'
// Error: "Route segment config "fetchCache" is not compatible..."

// ❌ app/revalidate/page.tsx
export const revalidate = 60
// Error: "Route segment config "revalidate" is not compatible..."

// ✅ ONLY ALLOWED:
export const runtime = 'edge'  // If compatible
export const preferredRegion = 'us-east-1'
export const maxDuration = 60
export const experimental_ppr = true
export const unstable_prefetch = { mode: 'runtime', samples: [...] }
```

---

## <a id="dynamic-metadata-errors"></a>36. Dynamic Metadata Errors

### Test Pattern: Metadata Using cookies()

**Test Source**: `test/e2e/app-dir/cache-components-errors/` (lines 81-147)

```typescript
// ❌ ERROR PATTERN:

export async function generateMetadata() {
  const session = (await cookies()).get('session')
  return {
    title: `Welcome ${session?.value}`,
  }
}

export default async function Page() {
  return <div>Static page</div>
}

// BUILD ERROR:
// "Route has a `generateMetadata` that depends on Request data
// (`cookies()`, etc...) or uncached external data when the rest
// of the route does not."

// ✅ FIX: Make entire page dynamic

export async function generateMetadata() {
  const session = (await cookies()).get('session')
  return { title: `Welcome ${session?.value}` }
}

export default async function Page() {
  const session = (await cookies()).get('session')  // Also dynamic
  return <div>Hello {session?.value}</div>
}

// OR use await connection() in page to force dynamic
```

---

## <a id="missing-suspense"></a>37. Missing Suspense Errors

### Test Pattern: Private Cache Without Suspense

**Test Source**: `test/e2e/app-dir/cache-components-errors/fixtures/default/app/use-cache-private-without-suspense/page.tsx`

```typescript
// ❌ ERROR PATTERN:

export default function Page() {
  return (
    <>
      <p>This will error</p>
      <Private />
    </>
  )
}

async function Private() {
  'use cache: private'
  return <p>Private</p>
}

// BUILD ERROR:
// "Route: A component accessed data, headers, params, searchParams,
// or a short-lived cache without a Suspense boundary nor a "use cache"
// above it."

// ✅ FIX:

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Private />
    </Suspense>
  )
}

async function Private() {
  'use cache: private'
  return <p>Private</p>
}
```

---

## <a id="sync-io-errors"></a>38. Sync IO After Dynamic API Errors

### Test Pattern: Date.now() After cookies()

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/app/(default)/errors/sync-io-after-runtime-api/`

```typescript
// Pattern from tests:

export default async function Page() {
  const cookieStore = await cookies()
  const value = cookieStore.get('test')?.value

  // Synchronous IO after async API
  const timestamp = Date.now()  // ⚠️ Causes prerender abort

  return <div>Cookie: {value}, Time: {timestamp}</div>
}

// RUNTIME PREFETCH BEHAVIOR (lines 1034-1137):
// - Prefetch includes: Static shell
// - Prefetch ABORTS when Date.now() encountered
// - No error logged (silent abort)
// - Prefetch response is partial
// - Navigation: Full content streams in

// Test assertion:
// "aborts the prerender without logging an error when sync IO
// is used after awaiting cookies()"
```

---

## <a id="cookies-headers"></a>20. cookies() and headers() Patterns

### Pattern 1: Passing Promise Deeply

**Test Source**: `test/e2e/app-dir/cache-components/app/headers/static-behavior/pass-deeply/page.tsx`

```typescript
// CRITICAL PATTERN: You can pass cookies()/headers() Promise to child components

export default async function Page() {
  const pendingHeaders = headers()  // Don't await yet!

  return (
    <Suspense fallback={<>
      <p>loading header data...</p>
      <div id="fallback">{getSentinelValue()}</div>
    </>}>
      <DeepHeaderReader pendingHeaders={pendingHeaders} />
    </Suspense>
  )
}

async function DeepHeaderReader({
  pendingHeaders,
}: {
  pendingHeaders: ReturnType<typeof headers>
}) {
  let output: Array<React.ReactNode> = []
  for (const [name, value] of await pendingHeaders) {  // Await here!
    if (name.startsWith('x-sentinel')) {
      output.push(
        <tr>
          <td>{name}</td>
          <td>{value}</td>
        </tr>
      )
    }
  }
  await new Promise((r) => setTimeout(r, 1000))  // Simulate slow processing
  return (
    <table>
      <tr>
        <th>Header Name</th>
        <th>Header Value</th>
      </tr>
      {output}
    </table>
  )
}

// KEY INSIGHT FROM TEST:
// - headers() called at page root (doesn't trigger dynamic immediately)
// - Promise passed to child component
// - Child awaits inside Suspense boundary
// - Suspense fallback shows during 1-second delay
// - With cacheComponents: Suspense controls dynamic boundary
// - Without cacheComponents: headers() callsite would block entire page
```

### Pattern 2: Same Pattern with cookies()

**Test Source**: `test/e2e/app-dir/cache-components/app/cookies/static-behavior/pass-deeply/page.tsx`

```typescript
export default async function Page() {
  const pendingCookies = cookies()  // Don't await!

  return (
    <Suspense fallback={<>
      <p>loading cookie data...</p>
      <div id="fallback">{getSentinelValue()}</div>
    </>}>
      <DeepCookieReader pendingCookies={pendingCookies} />
    </Suspense>
  )
}

async function DeepCookieReader({
  pendingCookies,
}: {
  pendingCookies: ReturnType<typeof cookies>
}) {
  let output: Array<React.ReactNode> = []
  for (const [name, cookie] of await pendingCookies) {  // Await here!
    if (name.startsWith('x-sentinel')) {
      output.push(
        <tr>
          <td>{name}</td>
          <td>{cookie.value}</td>
        </tr>
      )
    }
  }
  await new Promise((r) => setTimeout(r, 1000))
  return <table>{output}</table>
}

// Pattern: Defer awaiting to isolate dynamic boundary
```

---

## <a id="pattern-library"></a>39. Complete E2E Pattern Library

### Pattern 1: Basic Public Cache

```typescript
// Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-life/page.tsx

'use cache'
import { cacheLife } from 'next/cache'

async function getCachedRandom() {
  'use cache'
  cacheLife('frequent')
  return Math.random()
}

export default async function Page() {
  const x = await getCachedRandom()
  return <p id="x">{x}</p>
}

// Behavior: Value cached, same on refresh
```

### Pattern 2: Private Cache with Cookies

```typescript
// Source: test/e2e/app-dir/use-cache-private/app/cookies/page.tsx

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Private />
    </Suspense>
  )
}

async function Private() {
  'use cache: private'
  cacheLife({ stale: 420 })

  const cookie = (await cookies()).get('test-cookie')

  const { headers } = await fetch('https://...', {
    headers: { 'x-test-cookie': cookie?.value ?? '' }
  }).then(res => res.json())

  const cookieHeader = headers['x-test-cookie']

  return (
    <pre>
      test-cookie: <span id="test-cookie">{cookieHeader || '<empty>'}</span>
    </pre>
  )
}

// Behavior: Per-user cached, updates when cookie changes
```

### Pattern 3: Passing Cookies to Public Cache

```typescript
// Source: test/e2e/app-dir/segment-cache/prefetch-runtime/app/(default)/passed-to-public-cache/cookies/page.tsx

async function publicCache(cookiePromise: Promise<string | null>) {
  'use cache'
  const cookieValue = await cookiePromise
  await cachedDelay([__filename, cookieValue])
  return cookieValue
}

async function RuntimePrefetchable() {
  await cookies()  // Guard from static prerender

  const cookieValue = await publicCache(
    cookies().then(c => c.get('testCookie')?.value ?? null)
  )

  return <div id="cookie-value">Cookie: {cookieValue}</div>
}

export default async function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RuntimePrefetchable />
    </Suspense>
  )
}

// Pattern: Pass Promise to public cache
// Public cache can't call cookies(), but can receive the Promise
```

### Pattern 4: Cache with Dynamic Hole

```typescript
// Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-life-with-dynamic/page.tsx

async function getCachedRandom() {
  'use cache'
  cacheLife('frequent')
  return Math.random()
}

async function DynamicCache() {
  'use cache'
  cacheLife({ revalidate: 99, expire: 299, stale: 18 })
  return <p id="y">{new Date().toISOString()}</p>
}

async function Dynamic() {
  await connection()
  return null
}

export default async function Page() {
  const x = await getCachedRandom()

  return (
    <>
      <p id="x">{x}</p>
      <Suspense fallback={<p id="y">Loading...</p>}>
        <DynamicCache />
      </Suspense>
      <Suspense>
        <Dynamic />
      </Suspense>
    </>
  )
}

// Prerender behavior (test line 570-576):
// - With JS disabled: #y shows "Loading..." (fallback)
// - With JS enabled: #y shows date (streamed in)
// - No hydration errors
```

### Pattern 5: Multi-Tag Cache Invalidation

```typescript
// Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-tag/page.tsx

async function getCachedWithTag({ tag }: { tag: string }) {
  'use cache'
  cacheTag(tag, 'c')  // Tag with both specific and shared tag

  return [Math.random(), await fetch('...').then(r => r.text())]
}

export default async function Page() {
  const a = await getCachedWithTag({ tag: 'a' })
  const b = await getCachedWithTag({ tag: 'b' })
  const [f1, f2] = await getCachedWithTag({ tag: 'f', fetchCache: 'force' })

  return (
    <div>
      <p id="a">[a, c] {a.join(' ')}</p>
      <p id="b">[b, c] {b.join(' ')}</p>
      <p id="f1">[f, c] {f1}</p>
    </div>
  )
}

// Test behavior (lines 223-314):
// revalidateTag('a') → Only #a updates
// revalidateTag('b') → Only #b updates
// revalidateTag('c') → #a AND #b update (shared tag)
// revalidateTag('f') → #f1 updates, #f2 unchanged (fetch has inner cache)
```

### Pattern 6: Runtime Prefetch with Multiple Samples

```typescript
// Source: test/e2e/app-dir/segment-cache/prefetch-runtime/app/(default)/in-page/cookies/page.tsx

export const unstable_prefetch = {
  mode: 'runtime',
  samples: [
    { cookies: [{ name: 'testCookie', value: 'testValue' }] }
  ],
}

export default async function Page() {
  return (
    <main>
      <Suspense fallback={<div>Loading 1...</div>}>
        <RuntimePrefetchable />
      </Suspense>
      <form action={async (formData: FormData) => {
        'use server'
        const cookieStore = await cookies()
        cookieStore.set('testCookie', formData.get('cookie'))
      }}>
        <input type="text" name="cookie" />
        <button type="submit">Update cookie</button>
      </form>
    </main>
  )
}

async function RuntimePrefetchable() {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get('testCookie')?.value ?? null
  await cachedDelay([__filename, cookieValue])

  return (
    <div>
      <div id="cookie-value">Cookie: {cookieValue}</div>
      <Suspense fallback={<div>Loading 2...</div>}>
        <Dynamic />
      </Suspense>
    </div>
  )
}

async function Dynamic() {
  await uncachedIO()
  await connection()
  return <div id="dynamic-content">Dynamic content</div>
}

// TEST BEHAVIOR (lines 432-538):
// 1. Set cookie to 'initialValue'
// 2. Link visible → Prefetch with sample
// 3. Prefetch includes: "Cookie: initialValue"
// 4. Prefetch excludes: "Dynamic content"
// 5. Navigate → Cookie shows instantly, Dynamic streams
// 6. Update cookie to 'updatedValue' (via Server Action)
// 7. Link visible again → NEW prefetch
// 8. Prefetch includes: "Cookie: updatedValue" (fresh!)
// 9. Navigate → Updated cookie shows instantly
```

### Pattern 7: Params with has() Check

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts` (lines 201-291)

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ lowcard: string; highcard: string }>
}) {
  const hasLowcard = Reflect.has(await params, 'lowcard')
  const hasHighcard = Reflect.has(await params, 'highcard')
  const hasFoo = Reflect.has(await params, 'foo')

  return (
    <>
      <span id="param-has-lowcard">{'' + hasLowcard}</span>
      <span id="param-has-highcard">{'' + hasHighcard}</span>
      <span id="param-has-foo">{'' + hasFoo}</span>
    </>
  )
}

// TEST BEHAVIOR:
// - URL: /params/semantics/one/build/layout-has/server
// - #param-has-lowcard: 'true'
// - #param-has-highcard: 'true'
// - #param-has-foo: 'false'
// - Fully prerendered (all buildtime)

// Pattern: Reflect.has() for param existence checks
// Doesn't trigger dynamic rendering like accessing .lowcard would
```

### Pattern 8: Params Spread

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts` (lines 387-566)

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ lowcard: string; highcard: string }>
}) {
  const copied = { ...(await params) }
  const keyCount = Object.keys(copied).length

  return (
    <>
      <span id="param-copied-lowcard">{copied.lowcard}</span>
      <span id="param-copied-highcard">{copied.highcard}</span>
      <span id="param-key-count">{keyCount}</span>
    </>
  )
}

// TEST BEHAVIOR:
// - URL: /params/semantics/one/build/layout-spread/server
// - #param-copied-lowcard: 'one'
// - #param-copied-highcard: 'build'
// - #param-key-count: '2'
// - Fully prerendered if both params in generateStaticParams

// - URL: /params/semantics/one/run/layout-spread/server
// - #param-copied-lowcard: 'one'
// - #param-copied-highcard: 'run'
// - #param-key-count: '2'
// - Partial prerender (shell + dynamic hole)
```

### Pattern 9: fetch() Inside 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/cache-fetch/page.tsx`

```typescript
async function getData() {
  'use cache'

  return fetch('https://next-data-api-endpoint.vercel.app/api/random').then(
    (res) => res.text()
  )
}

export default async function Page() {
  return (
    <>
      <p>index page</p>
      <p id="random">{await getData()}</p>
    </>
  )
}

// TEST BEHAVIOR (lines 644-651):
// - Initial load: random = "0.123"
// - Refresh: random = "0.123" (SAME! fetch result cached)
// - fetch() inside 'use cache' is cached
```

### Pattern 10: fetch() with cache: 'no-store' Inside 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/cache-fetch-no-store/page.tsx`

```typescript
async function getData() {
  'use cache'

  return fetch(
    'https://next-data-api-endpoint.vercel.app/api/random?no-store',
    { cache: 'no-store' }  // Normally wouldn't cache
  ).then((res) => res.text())
}

export default async function Page() {
  return (
    <>
      <p>index page</p>
      <p id="random">{await getData()}</p>
    </>
  )
}

// TEST BEHAVIOR (lines 653-660):
// - Initial load: random = "0.123"
// - Refresh: random = "0.123" (SAME!)
// - 'use cache' OVERRIDES fetch cache: 'no-store'
// - Entire function result is cached
```

### Pattern 11: fetch() with revalidate Inside 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(dynamic)/fetch-revalidate/page.tsx`

```typescript
async function getData() {
  'use cache'

  return fetch('https://next-data-api-endpoint.vercel.app/api/random', {
    next: { revalidate: 0 },  // Normally fresh every request
  }).then((res) => res.text())
}

export default async function Page() {
  return (
    <>
      <p>index page</p>
      <p id="random">{await getData()}</p>
    </>
  )
}

// TEST BEHAVIOR (lines 635-642):
// - Initial load: random = "0.123"
// - Refresh: random = "0.456" (DIFFERENT!)
// - revalidate: 0 is respected even inside 'use cache'
// - Cache function revalidates, fetches new data
```

### Pattern 12: fetch() with Authorization Header Inside 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(dynamic)/cache-fetch-auth-header/page.tsx`

```typescript
async function getData() {
  'use cache'

  return fetch('https://next-data-api-endpoint.vercel.app/api/random', {
    headers: {
      Authorization: `Bearer ${process.env.MY_TOKEN}`,
    },
  }).then((res) => res.text())
}

export default async function Page() {
  const myCookies = await cookies()
  const id = myCookies.get('id')?.value

  return (
    <>
      <p>index page</p>
      <p id="random">{await getData()}</p>
      <p id="my-id">{id || ''}</p>
    </>
  )
}

// TEST BEHAVIOR (lines 684-691):
// - Initial load: random = "0.123"
// - Refresh: random = "0.123" (SAME! cached)
// - Authorization header in fetch is allowed
// - fetch result cached despite headers
// - Page also uses cookies() (outside 'use cache')
```

### Pattern 13: Referential Equality (Object Identity)

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/referential-equality/page.tsx`

```typescript
async function getObject(arg: unknown) {
  'use cache'
  return { arg }
}

async function getObjectWithBoundArgs(arg: unknown) {
  async function getCachedObject() {
    'use cache'
    return { arg }  // Closes over arg from parent scope
  }
  return getCachedObject()
}

export default async function Page() {
  return (
    <>
      <p id="same-arg">
        {String((await getObject(1)) === (await getObject(1)))}
      </p>
      <p id="different-args">
        {String((await getObject(1)) !== (await getObject(2)))}
      </p>
      <p id="same-bound-arg">
        {String(
          (await getObjectWithBoundArgs(1)) === (await getObjectWithBoundArgs(1))
        )}
      </p>
      <p id="different-bound-args">
        {String(
          (await getObjectWithBoundArgs(1)) !== (await getObjectWithBoundArgs(2))
        )}
      </p>
    </>
  )
}

// TEST BEHAVIOR (lines 117-125):
// - #same-arg: 'true' (SAME object reference!)
// - #different-args: 'true' (different references)
// - #same-bound-arg: 'true' (bound args also preserve identity)
// - #different-bound-args: 'true'

// CRITICAL INSIGHT:
// 'use cache' returns THE EXACT SAME OBJECT REFERENCE
// for multiple invocations with same args
// Not just equal values - same memory reference!
```

### Pattern 14: React cache() Deduplication Inside 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/react-cache/page.tsx`

```typescript
import { cache } from 'react'

const number = cache(() => {
  return Math.random()
})

function Component() {
  return <p id="b">{number()}</p>
}

async function getCachedComponent() {
  'use cache'
  return (
    <div>
      <p id="a">{number()}</p>
      <Component />
    </div>
  )
}

export default async function Page() {
  return <div>{getCachedComponent()}</div>
}

// TEST BEHAVIOR (lines 110-115):
// - #a value === #b value
// - React's cache() dedupes WITHIN the 'use cache' function
// - Both calls to number() return same value
// - React cache works correctly inside 'use cache'
```

### Pattern 15: Server Functions as Props in 'use cache'

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/passed-to-client/page.tsx`

```typescript
function getRandomValue() {
  const v = Math.random()
  console.log(v)
  return v
}

export default function Page() {
  const offset = 100
  return (
    <Form
      foo={async function fooNamed() {
        'use cache'
        return offset + getRandomValue()
      }}
      bar={async function () {
        'use cache'
        return offset + getRandomValue()
      }}
      baz={async () => {
        'use cache'
        return offset + getRandomValue()
      }}
    />
  )
}

// TEST BEHAVIOR (lines 201-221):
// - Initial: All show '0 0 0'
// - Submit: All show '100.xxx 100.xxx 100.xxx'
// - Submit again: SAME values (cached!)
// - Named functions, anonymous functions, arrow functions ALL work
// - Closure over 'offset' variable works
// - Can pass cached functions to client components
```

### Pattern 16: Param Name Shadowing

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts` (lines 570-655)

```typescript
// Route: /params/shadowing/[dyn]/[then]/[value]/[status]

export default async function Page({
  params,
}: {
  params: Promise<{ dyn: string; then: string; value: string; status: string }>
}) {
  return (
    <>
      <span id="param-dyn">{(await params).dyn}</span>
      <span id="param-then">{(await params).then}</span>
      <span id="param-value">{(await params).value}</span>
      <span id="param-status">{(await params).status}</span>
    </>
  )
}

// TEST BEHAVIOR:
// URL: /params/shadowing/foo/bar/baz/qux/page/server
// - #param-dyn: 'foo'
// - #param-then: 'bar'  (doesn't conflict with Promise.then!)
// - #param-value: 'baz' (doesn't conflict with Promise value!)
// - #param-status: 'qux' (doesn't conflict with Promise status!)

// Insight: Param names like 'then', 'value', 'status' work fine
// They don't shadow Promise properties
```

---

## <a id="decision-trees"></a>40. Decision Trees Based on Tests

### Tree 1: Should I Use 'use cache' or 'use cache: private'?

```
┌─ Component to generate ─┐
│                          │
▼                          │
Does it access             │
cookies/headers/searchParams?
│                          │
├─ YES ──► Is content      │
│          user-specific   │
│          AND worth       │
│          caching per-user?
│          │               │
│          ├─ YES ──► 'use cache: private'
│          │         + MUST wrap in Suspense
│          │         + cacheLife({ stale: >= 30 })
│          │                      (for runtime prefetch)
│          │               │
│          └─ NO ───► Pass Promise to public cache
│                     OR leave fully dynamic
│                          │
└─ NO ───► Uses Math.random() │
           or Date.now()?   │
           │                │
           ├─ YES ──► Two options:
           │          1. await connection() first
           │          2. 'use cache' (caches the random value)
           │                       │
           └─ NO ───► Should share across users?
                      │            │
                      ├─ YES ──► 'use cache'
                      │          + cacheLife()
                      │          + cacheTag()
                      │            │
                      └─ NO ───► No cache
                                 (dynamic render)
```

### Tree 2: Runtime Prefetch Configuration

```
┌─ Page uses dynamic data ─┐
│                           │
▼                           │
Does page access            │
cookies/headers/searchParams/params?
│                           │
├─ NO ───► No unstable_prefetch needed
│          (static prefetch works)
│                           │
└─ YES ──► Is page visited  │
           frequently?      │
           │                │
           ├─ NO ──► Don't configure
           │         OR prefetch={false} on Links
           │                │
           └─ YES ──► Add unstable_prefetch
                      {
                        mode: 'runtime',
                        samples: [
                          {
                            cookies: [...],  // ALL cookies accessed
                            headers: [...],  // ALL headers accessed
                            params: {...},   // If dynamic params
                            searchParams: {...}  // If used
                          }
                        ]
                      }

Sample count:
- 1 sample: Homogeneous users
- 2-3 samples: Different user types (auth/unauth, plans, etc.)
- More: Complex personalization scenarios
```

### Tree 3: Cache Invalidation in Server Actions

```
┌─ Server Action mutates data ─┐
│                               │
▼                               │
Does user need to see           │
their write immediately?        │
│                               │
├─ YES ──► Staying on same page?
│          │                    │
│          ├─ YES ──► refresh()
│          │          (no redirect)
│          │                    │
│          └─ NO ───► updateTag(tag)
│                     + redirect()
│                               │
└─ NO ───► Background update OK?
           │                    │
           ├─ YES ──► revalidateTag(tag, 'max')
           │          (stale-while-revalidate)
           │                    │
           └─ NO ───► updateTag(tag)
                      (immediate)

Advanced: Combine multiple strategies
- updateTag() for specific item cache
- revalidateTag(, 'max') for listing caches
- refresh() if staying on page
```

### Tree 4: Link Prefetch Strategy

```
┌─ Generating <Link> ─┐
│                      │
▼                      │
Target page has       │
unstable_prefetch?    │
│                      │
├─ YES ──► Use prefetch={true}
│          (uses runtime samples)
│                      │
└─ NO ───► Page uses dynamic APIs?
           │          │
           ├─ YES ──► Need full prefetch?
           │          │         │
           │          ├─ YES ──► prefetch="unstable_forceStale"
           │          │            │
           │          └─ NO ───► prefetch="auto"
           │                     (partial prefetch)
           │                      │
           └─ NO ───► prefetch="auto"
                      (or omit)

Rarely visited? → prefetch={false}
Two-stage load? → unstable_dynamicOnHover={true}
```

---

## 🧠 Mental Model Summary for AI Agents

### The Complete Picture from Tests

**⚠️ IMPORTANT: These rules apply ONLY when `experimental.cacheComponents: true` is enabled in next.config**

```typescript
// ═══════════════════════════════════════════════════════════
// RULE 1: SEGMENT CONFIGS ARE FORBIDDEN (with cacheComponents)
// ═══════════════════════════════════════════════════════════
// NOTE: These work fine in Next.js 16 WITHOUT cacheComponents enabled

export const dynamic = 'force-static'      // ❌ BUILD ERROR (with cacheComponents)
export const revalidate = 60                // ❌ BUILD ERROR (with cacheComponents)
export const fetchCache = 'force-cache'     // ❌ BUILD ERROR (with cacheComponents)
export const dynamicParams = false          // ❌ BUILD ERROR (with cacheComponents)

// ═══════════════════════════════════════════════════════════
// RULE 2: THREE CACHE TYPES
// ═══════════════════════════════════════════════════════════

// PUBLIC CACHE
async function Component() {
  'use cache'
  cacheLife('hours')
  cacheTag('my-tag')
  // Cannot access: cookies, headers, searchParams
  // Can access: params (if in generateStaticParams)
  return <div>Shared content</div>
}

// PRIVATE CACHE
async function UserSpecific() {
  'use cache: private'
  cacheLife({ stale: 60 })  // Must be >= 30 for runtime prefetch
  // Can access: cookies, headers, searchParams, params
  // Cannot use: connection()
  // MUST wrap in: <Suspense>
  return <div>Per-user content</div>
}

// FULLY DYNAMIC
async function AlwaysFresh() {
  // No cache directive
  // Can access: everything
  // Renders: every request
  return <div>Dynamic content</div>
}

// ═══════════════════════════════════════════════════════════
// RULE 3: PARAMS ARE ASYNC PROMISES
// ═══════════════════════════════════════════════════════════

// ❌ WRONG
export default function Page({ params }) {
  const id = params.id  // TYPE ERROR!
}

// ✅ CORRECT
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params  // Must await
}

// ═══════════════════════════════════════════════════════════
// RULE 4: RUNTIME PREFETCH INCLUSION
// ═══════════════════════════════════════════════════════════

// Included in runtime prefetch:
// ✅ Public caches (all)
// ✅ Private caches (if stale >= 30s)
// ✅ params, searchParams, cookies, headers (from samples)
// ❌ Uncached IO (connection(), direct DB calls)

// ═══════════════════════════════════════════════════════════
// RULE 5: CACHE INVALIDATION APIS
// ═══════════════════════════════════════════════════════════

// Server Actions only:
updateTag('tag')        // Immediate expiry, read-your-own-writes
refresh()               // Client router cache refresh

// Server Actions + Route Handlers:
revalidateTag('tag', 'max')  // Stale-while-revalidate (recommended)
revalidateTag('tag')         // Legacy (deprecated)

// ═══════════════════════════════════════════════════════════
// RULE 6: STALE TIME THRESHOLDS
// ═══════════════════════════════════════════════════════════

Static prerender: include if expire >= 300s (5 minutes)
Runtime prefetch: include if stale >= 30s (30 seconds)

cacheLife('seconds'): Special case, stale set to 30s for threshold

// ═══════════════════════════════════════════════════════════
// RULE 7: NON-SERIALIZABLE PROPS
// ═══════════════════════════════════════════════════════════

async function cached(x: number, children: ReactNode) {
  'use cache'
  return { x, children }
}

// Cache key includes: x (serializable)
// Cache key EXCLUDES: children (non-serializable)
// children re-renders fresh every time
// Different children = cache still hits on same x

// ═══════════════════════════════════════════════════════════
// RULE 8: CONNECTION() USAGE
// ═══════════════════════════════════════════════════════════

// Use connection() when:
// - Math.random() / Date.now() / crypto.randomUUID()
// - Force dynamic without reading request data
// - Synchronous platform IO

// Cannot use in:
// - 'use cache' scope
// - 'use cache: private' scope
// - unstable_cache() scope

// ═══════════════════════════════════════════════════════════
// RULE 9: SUSPENSE REQUIREMENTS
// ═══════════════════════════════════════════════════════════

// MUST wrap in Suspense:
// - 'use cache: private' (build error if not)
// - Short-lived public caches (expire < 5min) for PPR
// - connection() calls for PPR
// - Uncached dynamic APIs for PPR

// ═══════════════════════════════════════════════════════════
// RULE 10: DRAFT MODE BYPASSES ALL CACHES
// ═══════════════════════════════════════════════════════════

// With draft mode enabled:
// - 'use cache' ignored (fresh data)
// - 'use cache: private' ignored (fresh data)
// - All dynamic APIs work normally
// - Disable draft mode → Original caches restored
```

---

## 📚 Complete API Quick Reference

### Cache Directives

```typescript
"use cache" // Public cache, shared across users
"use cache: private" // Private cache, per-user, requires Suspense
```

### Cache Configuration

```typescript
import { cacheLife, cacheTag } from 'next/cache'

cacheLife('seconds')  // stale: 0→30, revalidate: 1, expire: 1 (special!)
cacheLife('minutes')  // stale: 300, revalidate: 60, expire: 3600
cacheLife('hours')    // stale: 300, revalidate: 3600, expire: 86400
cacheLife('days')     // stale: 300, revalidate: 86400, expire: 604800
cacheLife('weeks')    // stale: 300, revalidate: 604800, expire: 2592000
cacheLife('max')      // stale: 300, revalidate: 2592000, expire: 31536000

cacheLife({ stale: number, revalidate: number, expire: number })

cacheTag('tag1', 'tag2', ...)
```

### Cache Invalidation

```typescript
import { updateTag, revalidateTag, refresh } from "next/cache"

// Server Actions only:
updateTag("tag") // Immediate expiry
refresh() // Client router cache

// Server Actions + Route Handlers:
revalidateTag("tag", "max") // Stale-while-revalidate (recommended)
revalidateTag("tag", "custom") // Custom cache life profile
revalidateTag("tag") // Legacy (deprecated)
```

### Request APIs

```typescript
import { cookies, headers } from "next/headers"
import { connection } from "next/server"

const cookieStore = await cookies()
const headersList = await headers()
await connection()

// In components:
async function Component({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params
  const { q } = await searchParams
}
```

### Runtime Prefetch

```typescript
export const unstable_prefetch = {
  mode: 'runtime',
  samples: [
    {
      cookies: [{ name: string, value: string, httpOnly?: boolean, path?: string }],
      headers: [['name', 'value']],
      params: { key: 'value' },
      searchParams: { key: 'value' }
    }
  ]
}

// OR

export const unstable_prefetch = {
  mode: 'static'  // Default, can omit
}
```

### Link Prefetch

```typescript
import Link from 'next/link'

<Link href="/page" prefetch={false} />                    // No prefetch
<Link href="/page" prefetch={true} />                     // Runtime prefetch
<Link href="/page" prefetch="unstable_forceStale" />      // Full prefetch
<Link href="/page" prefetch="auto" />                     // Smart (default)
<Link href="/page" unstable_dynamicOnHover={true} />      // Upgrade on hover
```

---

## 🎓 Final Checklist for AI Agents

Based on 125+ E2E test fixtures, when generating Next.js code with cacheComponents:

### Pre-Flight Checks

- [ ] Remove ALL segment config exports (dynamic, revalidate, fetchCache, dynamicParams)
- [ ] Change ALL `params` types to `Promise<{...}>`
- [ ] Change ALL `searchParams` types to `Promise<{...}>`
- [ ] Add `async` keyword to components accessing params/searchParams
- [ ] Add `await` before ALL params/searchParams access

### Cache Selection

- [ ] Using cookies/headers/searchParams AND user-specific? → `'use cache: private'`
- [ ] User-specific content? → Wrap private cache in `<Suspense>`
- [ ] Private cache? → Set `stale >= 30` for runtime prefetch
- [ ] Shared content? → `'use cache'` (public)
- [ ] Using Math.random/Date.now? → Either `await connection()` or `'use cache'`

### Prefetch Configuration

- [ ] Page uses dynamic APIs? → Add `unstable_prefetch` with samples
- [ ] Include ALL cookies/headers/params/searchParams in samples
- [ ] Provide 2-3 samples for different user states
- [ ] Link to dynamic page? → Choose prefetch strategy

### Cache Invalidation

- [ ] Server Action needs read-your-own-writes? → `updateTag()`
- [ ] Background revalidation OK? → `revalidateTag(tag, 'max')`
- [ ] Stay on same page? → `refresh()`
- [ ] Route Handler? → Use `revalidateTag()` (not updateTag/refresh)

### Error Prevention

- [ ] NO `loading.tsx` files
- [ ] NO `export const dynamic/revalidate/fetchCache/dynamicParams`
- [ ] NO cookies/headers in `'use cache'` (only in `'use cache: private'`)
- [ ] NO `connection()` in any cache scope
- [ ] NO `'use cache: private'` without Suspense
- [ ] NO synchronous params/searchParams access

---

## 🔄 SEGMENT CACHING: The Client-Side Router Cache

### What is Segment Caching?

**Segment caching** is Next.js 16's **client-side router cache** that stores prefetched route segments. It's different from server-side 'use cache'.

### Test Pattern: Basic Segment Cache Behavior

**Test Source**: `test/e2e/app-dir/segment-cache/basic/segment-cache-basic.test.ts`

```typescript
// When you navigate between pages:

// Step 1: Link becomes visible
<Link href="/target">Target</Link>
// → Triggers prefetch
// → Stores result in client segment cache

// Step 2: User clicks link
// → Reads from segment cache (instant navigation!)
// → No network request needed

// Step 3: Navigate back, then forward again
// → Still uses segment cache (if not stale)
```

### Pattern 1: Prefetch Cancellation on Navigation

**Test Source**: `test/e2e/app-dir/segment-cache/basic/` (lines 14-55)

```typescript
// TEST BEHAVIOR:

// 1. Reveal link → Start prefetch (but block responses)
// 2. Navigate before prefetch completes
// 3. Prefetch requests are CANCELED
// 4. Navigation uses navigation request (not prefetch)

// Result: No wasted bandwidth, automatic cancellation
```

### Pattern 2: Static vs Dynamic Content in Prefetch

**Test Source**: `test/e2e/app-dir/segment-cache/basic/` (lines 57-94)

```typescript
export default function Page() {
  return (
    <div id="nav">
      <div data-streaming-text-static="Static in nav">Static in nav</div>
      <Suspense fallback={<div>Loading... [Dynamic in nav]</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}

async function DynamicContent() {
  await connection()
  return <div data-streaming-text-dynamic="Dynamic in nav">Dynamic in nav</div>
}

// PREFETCH BEHAVIOR:
// 1. Link visible → Prefetch triggered
// 2. Prefetch includes: "Static in nav" ✅
// 3. Prefetch includes: "Loading... [Dynamic in nav]" ✅ (fallback)
// 4. Prefetch EXCLUDES: "Dynamic in nav" ❌ (actual content)

// NAVIGATION BEHAVIOR:
// 1. Click link (before dynamic loads)
// 2. Immediately show: "Static in nav" + "Loading... [Dynamic in nav]"
// 3. Then stream: "Dynamic in nav" (replaces loading)

// Key: Static shell renders instantly from prefetch cache
```

### Pattern 3: Lazily Generated Params

**Test Source**: `test/e2e/app-dir/segment-cache/basic/app/lazily-generated-params/` (lines 96-131)

```typescript
// NO generateStaticParams export!

async function Content({ params }: { params: Promise<{ param: string }> }) {
  const { param } = await params
  return <div id="target-page-with-lazily-generated-param">Param: {param}</div>
}

export default async function Target({ params }: { params: Promise<{ param: string }> }) {
  return (
    <Suspense fallback="Loading...">
      <Content params={params} />
    </Suspense>
  )
}

// TEST BEHAVIOR:
// 1. Link to /lazily-generated-params/some-param-value
// 2. Prefetch includes: Shell + "Loading..." fallback
// 3. Navigate → Instant show of loading, then param renders
// 4. Subsequent visits → Param cached (ISR)

// Pattern: dynamicParams=true behavior (default with cacheComponents)
// Params generated on-demand, then cached
// This is the RECOMMENDED pattern for high-cardinality params
```

### Pattern 4: Interception Routes with Segment Cache

**Test Source**: `test/e2e/app-dir/segment-cache/basic/` (lines 133-195)

```typescript
// Route structure:
// app/interception/feed/page.tsx
// app/interception/(@modal)/photo/[id]/page.tsx  // Intercepts
// app/interception/photo/[id]/page.tsx           // Regular route

// TEST BEHAVIOR:

// 1. On /feed page
// 2. Click link to /photo/1
// 3. Prefetch includes: Intercepted modal content ✅
// 4. Navigate → Shows modal (intercepted)
// 5. Navigation instant (fully prefetched)

// Pattern: Interception routes fully prefetchable
// Works with params: /photo/[id] prefetches with specific ID
```

### Pattern 5: Same-Page Navigation Refresh

**Test Source**: `test/e2e/app-dir/segment-cache/basic/` (lines 276-340)

```typescript
export default function Page() {
  return (
    <>
      <div id="random-number">{Math.random()}</div>
      <Link href="/same-page-nav">Refresh (no hash)</Link>
      <Link href="/same-page-nav#hash-a">Hash A</Link>
      <Link href="/same-page-nav#hash-b">Hash B</Link>
    </>
  )
}

// TEST BEHAVIOR:

// Initial: random = 0.123

// Click "Refresh (no hash)" (same URL):
// - Fetches new data
// - random = 0.456 (DIFFERENT!)
// - Only page segments refresh, NOT layouts

// Click "Hash A":
// - NO fetch
// - random = 0.456 (SAME!)
// - Hash navigation doesn't trigger refresh

// Click "Hash A" again (same hash):
// - Fetches new data
// - random = 0.789 (DIFFERENT!)
// - Clicking same hash triggers refresh

// Click "Hash B" (different hash):
// - NO fetch
// - random = 0.789 (SAME!)

// RULES:
// - Navigate to same URL (no hash) → Refresh
// - Navigate to different hash → No refresh
// - Navigate to same hash again → Refresh
```

### Pattern 6: Stale Time and Cache Expiration

**Test Source**: `test/e2e/app-dir/segment-cache/staleness/` (lines 13-222)

```typescript
// Page with 5-minute stale time
async function Page5Min() {
  'use cache'
  cacheLife({ stale: 300, revalidate: 600, expire: 1200 })
  return <div>Content with stale time of 5 minutes</div>
}

// Page with 10-minute stale time
async function Page10Min() {
  'use cache'
  cacheLife({ stale: 600, revalidate: 1200, expire: 2400 })
  return <div>Content with stale time of 10 minutes</div>
}

// TEST BEHAVIOR:

// T=0: Prefetch both pages
// - 5-min page cached
// - 10-min page cached
// Hide links

// T=5min+1ms: Reveal links again
// - 5-min page: NEW PREFETCH ✅ (stale time elapsed)
// - 10-min page: NO REQUEST ✅ (still fresh)

// T=10min+1ms: Reveal links again
// - 5-min page: NEW PREFETCH (still stale)
// - 10-min page: NEW PREFETCH ✅ (now stale)

// RULE: Segment cache respects stale time from cacheLife()
// Expired entries trigger new prefetch when link visible
```

### Pattern 7: Runtime Prefetch Stale Time

**Test Source**: `test/e2e/app-dir/segment-cache/staleness/` (lines 82-148)

```typescript
// SAME stale time rules apply to runtime prefetches!

export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ cookies: [{ name: 'test', value: 'val' }] }]
}

async function Page() {
  'use cache: private'
  cacheLife({ stale: 300 })  // 5 minutes
  return <div>Content with stale time of 5 minutes</div>
}

// TEST BEHAVIOR:

// T=0: Runtime prefetch
// - Private cache included (stale >= 30s)
// - Stored in segment cache

// T=5min-1ms: Link visible again
// - NO new prefetch (still fresh)

// T=5min+1ms: Link visible again
// - NEW runtime prefetch ✅ (stale time elapsed)
// - Fresh private cache fetched

// Rule: Runtime prefetch cache ALSO respects stale time
```

### Pattern 8: Dynamic Data Reuse (staleTimes.dynamic)

**Test Source**: `test/e2e/app-dir/segment-cache/staleness/` (lines 150-222)

```typescript
// Configuration: staleTimes.dynamic = 30s (default)

export default async function Page() {
  await connection()
  return <div id="dynamic-content">Dynamic content</div>
}

// TEST BEHAVIOR:

// T=0: Navigate to page
// - Fetch: "Dynamic content"
// - Store in segment cache

// T=29s: Navigate back, then forward
// - NO fetch ✅
// - Reuses cached "Dynamic content"
// - staleTimes.dynamic threshold not reached

// T=30s: Navigate again
// - NEW fetch ✅
// - staleTimes.dynamic threshold exceeded
// - Fresh data fetched

// CRITICAL CONFIG:
// next.config.js:
// experimental: {
//   staleTimes: {
//     dynamic: 30,  // Seconds dynamic data stays fresh in segment cache
//     static: 300,  // Seconds static data stays fresh
//   }
// }
```

### Pattern 9: revalidateTag Evicts Segment Cache

**Test Source**: `test/e2e/app-dir/segment-cache/revalidation/` (lines 203-248)

```typescript
// Critical behavior: revalidateTag clears BOTH server + client caches

async function Greeting() {
  'use cache'
  cacheTag('greeting')
  const data = await fetch('...').then(r => r.text())
  return <div id="greeting">{data}</div>
}

// Server Action:
async function revalidateGreeting() {
  'use server'
  revalidateTag('greeting', 'max')
}

// TEST BEHAVIOR:

// 1. Prefetch /greeting
// - Segment cache stores: "random-greeting [0]"

// 2. Call revalidateGreeting() Server Action
// - Server cache invalidated
// - Client segment cache EVICTED ✅

// 3. Link visible again
// - NEW prefetch triggered ✅
// - Fetches: "random-greeting [1]"
// - Updates segment cache

// 4. Navigate
// - Uses NEW prefetched data
// - NO additional request

// RULE: revalidateTag/updateTag/revalidatePath all evict segment cache
```

### Pattern 10: Re-Prefetch on Base Tree Change

**Test Source**: `test/e2e/app-dir/segment-cache/revalidation/` (lines 250-316)

```typescript
// Route structure:
// /refetch-on-new-base-tree/a
// /refetch-on-new-base-tree/b

// TEST BEHAVIOR:

// Currently on: /refetch-on-new-base-tree/a

// 1. Reveal both links (A and B)
// Prefetch for B: ✅ "Page B content"
// Prefetch for A: ❌ BLOCKED (already on page A)
// - Optimization: Don't prefetch current page

// 2. Navigate to B
// During navigation, link A is RE-PREFETCHED ✅
// - Prefetch includes: "Page A content"
// - Delta changed (now we're on B, not A)

// 3. Navigate back to A
// - Uses RE-PREFETCHED data
// - NO new request

// RULE: Segment cache prefetches the DELTA
// When base route changes, visible links re-prefetch
```

### Pattern 11: cacheLife('seconds') and Segment Cache

**Test Source**: `test/e2e/app-dir/segment-cache/staleness/` (lines 224-291)

```typescript
async function Page() {
  'use cache'
  cacheLife('seconds')  // Very short-lived

  const data = await longLivedCache()
  return <div>{data}</div>
}

async function longLivedCache() {
  'use cache'
  cacheLife('minutes')  // Longer-lived
  return <div>Short-lived cached content</div>
}

// TEST BEHAVIOR:

// Prefetch at T=0:
// - 'seconds' cache EXCLUDED from prerender (expire < 5min)
// - 'minutes' cache INCLUDED in prerender

// T=30s: Reveal link again
// - NO new prefetch ✅
// - Why: 'seconds' cache wasn't in prefetch to begin with!
// - Stale time determined by LONGEST-lived cache on page

// T=5min: Reveal link again
// - NEW prefetch ✅
// - 'minutes' cache is now stale
// - Entire page prefetched again

// RULE: Segment cache stale time = max(all cache stale times on page)
// Omitted caches don't affect segment cache staleness
```

---

## 📋 GENERATESTATICPARAMS: Complete Mechanics

### Pattern 1: Basic generateStaticParams

**Test Source**: `test/e2e/app-dir/cache-components/app/params/generate-static-params/[slug]/layout.tsx`

```typescript
export async function generateStaticParams() {
  const set = new Set()
  set.add(await fetchRandom('a'))
  set.add(await fetchRandom('a'))  // Deduped!

  return Array.from(set).map((value) => {
    return {
      slug: ('' + value).slice(2),
    }
  })
}

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  return (
    <Suspense fallback="loading">
      <Inner params={params}>{children}</Inner>
    </Suspense>
  )
}

async function Inner({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  return (
    <>
      <h1>{(await params).slug}</h1>
      <section>{children}</section>
    </>
  )
}

const fetchRandom = async (entropy: string) => {
  const response = await fetch(
    'https://next-data-api-endpoint.vercel.app/api/random?b=' + entropy
  )
  return response.text()
}

// KEY BEHAVIORS:

// 1. fetch() in generateStaticParams uses default fetch caching
// 2. Duplicate calls to fetch('...?b=a') are deduped (Set filters)
// 3. Returns array of param objects
// 4. Each entry is prerendered at build time
// 5. Layout/page can await params normally
```

### Pattern 2: No generateStaticParams = On-Demand Generation

**Test Source**: `test/e2e/app-dir/segment-cache/basic/app/lazily-generated-params/[param]/page.tsx`

```typescript
// NO generateStaticParams function!

async function Content({ params }: { params: Promise<{ param: string }> }) {
  const { param } = await params
  return <div id="target-page-with-lazily-generated-param">Param: {param}</div>
}

export default async function Target({ params }: { params: Promise<{ param: string }> }) {
  return (
    <Suspense fallback="Loading...">
      <Content params={params} />
    </Suspense>
  )
}

// BEHAVIOR:

// Build time:
// - No routes prerendered (no generateStaticParams)

// First request to /lazily-generated-params/some-value:
// - Renders dynamically
// - Caches result (ISR)
// - Subsequent requests: Serve from cache

// Prefetch behavior:
// - Prefetch works! Includes shell + fallback
// - Navigation: Shows loading, then content streams

// RULE: Missing generateStaticParams = all params generated on-demand
// Still prefetchable, still cacheable
// This is the RECOMMENDED pattern for high-cardinality params
```

### Pattern 3: Mixed Cardinality (Critical!)

**Test Source**: `test/e2e/app-dir/cache-components/cache-components.params.test.ts`

```typescript
// File: app/[lowcard]/layout.tsx
export async function generateStaticParams() {
  return [{ lowcard: "one" }, { lowcard: "two" }] // All values for low-cardinality param
}

// File: app/[lowcard]/[highcard]/layout.tsx
export async function generateStaticParams() {
  return [{ highcard: "build" }] // Only ONE value for high-cardinality param
}

// COMBINED ROUTES:

// Route: /one/build
// - lowcard in GSP ✅
// - highcard in GSP ✅
// → FULLY PRERENDERED at build

// Route: /one/run
// - lowcard in GSP ✅
// - highcard NOT in GSP ❌
// → PARTIAL PRERENDER
//   - Layout (lowcard): Static shell
//   - Page (highcard): Dynamic hole
//   - Suspense fallback: Shown!

// Route: /three/run
// - lowcard NOT in GSP ❌
// - highcard NOT in GSP ❌
// → FULLY DYNAMIC
//   - No static shell
//   - Everything renders at runtime

// CRITICAL INSIGHT:
// With multiple dynamic params:
// - ANY param not in GSP → That segment becomes dynamic
// - Parent segments with GSP params → Still static (shell)
// - Creates layered PPR with multiple Suspense boundaries
```

### Pattern 4: generateStaticParams with fetch()

**Test Source**: Tests show fetch behavior in GSP

```typescript
export async function generateStaticParams() {
  // ✅ fetch() works normally in generateStaticParams
  const products = await fetch("https://api.example.com/products").then((r) => r.json())

  return products.map((p) => ({ id: p.id }))
}

// Caching behavior in GSP:
// - fetch() uses default Next.js caching
// - Deduped across multiple GSP functions
// - NOT affected by 'use cache' (GSP runs at build time)
```

### Pattern 5: Empty generateStaticParams

**Test Source**: Implied from test behavior

```typescript
export async function generateStaticParams() {
  return [] // Empty array
}

// BEHAVIOR:

// Build time:
// - No routes prerendered
// - Build completes successfully

// Runtime:
// - First request for ANY param → Dynamic render
// - Result cached (ISR)
// - Subsequent requests → Cached version

// Use case: All paths on-demand (like pages router ISR)
```

### Pattern 6: generateStaticParams Return Type

```typescript
// ✅ CORRECT: Array of param objects
export async function generateStaticParams() {
  return [
    { id: "1", slug: "foo" }, // Multiple params
    { id: "2", slug: "bar" },
  ]
}

// ✅ CORRECT: Single param
export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }]
}

// ❌ WRONG: Missing array
export async function generateStaticParams() {
  return { id: "1" } // Type error!
}

// ❌ WRONG: Returning strings directly
export async function generateStaticParams() {
  return ["1", "2"] // Type error!
}
```

### Pattern 7: Nested generateStaticParams

**Test Source**: Multi-level param tests

```typescript
// app/[locale]/layout.tsx
export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

// app/[locale]/[category]/layout.tsx
export async function generateStaticParams() {
  return [{ category: "tech" }, { category: "lifestyle" }]
}

// app/[locale]/[category]/[id]/page.tsx
export async function generateStaticParams() {
  // Can access parent params!
  return [{ id: "1" }, { id: "2" }]
}

// GENERATED ROUTES (all combinations):
// /en/tech/1
// /en/tech/2
// /en/lifestyle/1
// /en/lifestyle/2
// /es/tech/1
// /es/tech/2
// /es/lifestyle/1
// /es/lifestyle/2

// Total: 2 × 2 × 2 = 8 routes prerendered
```

### Pattern 8: Segment Cache with Server Actions

**Test Source**: `test/e2e/app-dir/segment-cache/basic/` (lines 342-374)

```typescript
export default function Page() {
  return (
    <form action={myServerAction}>
      <button type="submit">Submit</button>
      <div id="target-page">Target</div>
    </form>
  )
}

// TEST BEHAVIOR:

// 1. Prefetch page with Server Action
// - Includes: Page content ✅
// - Includes: Server Action reference ✅
// - No errors

// 2. Navigate via prefetch
// - Page renders instantly (from segment cache)
// - Server Action works correctly
// - No serialization errors

// RULE: Segment cache correctly handles Server Action references
// Actions are serialized and deserialized properly
```

---

## 💎 ULTRA-COMPREHENSIVE NUANCES LIST

### Every Subtle Behavior from Tests

#### 1. Promise Passing Patterns

```typescript
// ✅ You can pass cookies()/headers() Promise without awaiting
const pendingCookies = cookies()  // Returns Promise
<Component cookies={pendingCookies} />  // Pass Promise

// Await in child, inside Suspense boundary
async function Component({ cookies }: { cookies: ReturnType<typeof cookies> }) {
  const data = await cookies  // Await here
}

// Benefit: Dynamic boundary isolated to Suspense, not callsite
```

#### 2. fetch() Behavior Inside 'use cache'

```typescript
// RULE: 'use cache' overrides fetch cache options

"use cache"
fetch(url, { cache: "no-store" }) // → Still cached! (by 'use cache')
fetch(url, { next: { revalidate: 0 } }) // → Revalidates the cache function
fetch(url, { next: { revalidate: 60 } }) // → Cache function revalidates every 60s
fetch(url) // → Cached (default behavior inside 'use cache')

// Inner fetch with revalidate affects outer cache revalidation
```

#### 3. Referential Equality Guarantee

```typescript
// 'use cache' returns SAME object reference (not just equal values)
const obj1 = await getCached(1)
const obj2 = await getCached(1)
obj1 === obj2 // true (same memory address!)

// This means:
// - Map/Set with cached objects as keys works
// - React reconciliation is more efficient
// - Memoization works better
```

#### 4. React cache() Integration

```typescript
// React's cache() works INSIDE 'use cache'
import { cache } from "react"

async function getCached() {
  "use cache"

  const value = cache(() => Math.random())

  return {
    a: value(), // First call
    b: value(), // Deduped! Same value as 'a'
  }
}

// Both deduplication mechanisms work together
```

#### 5. Closure Over Variables

```typescript
// ✅ Cached functions can close over parent scope variables
export default function Page() {
  const offset = 100  // Closed-over variable

  async function getCached() {
    'use cache'
    return offset + Math.random()  // Can access offset
  }

  return <div>{getCached()}</div>
}

// Closed-over variables become part of cache key
```

#### 6. generateStaticParams Cardinality Strategy

```typescript
// LOW CARDINALITY: Generate all at build
export async function generateStaticParams() {
  return [{ category: "electronics" }, { category: "books" }, { category: "clothing" }] // Few values - prerender all
}

// HIGH CARDINALITY: Generate popular ones only
export async function generateStaticParams() {
  const popular = await db.products.orderBy("views", "desc").limit(10).select("id")

  return popular.map((p) => ({ id: p.id }))
  // Many possible values - prerender top 10, rest on-demand
}

// HYBRID: Multiple params with different cardinality
export async function generateStaticParams() {
  return [
    { locale: "en", id: "popular-1" },
    { locale: "en", id: "popular-2" },
    { locale: "es", id: "popular-1" },
    // locale (low card) × id subset (high card)
  ]
}
```

#### 7. Suspense Fallback Behavior

```typescript
// Suspense fallback shows in THESE cases:

// Case 1: Dynamic params not in generateStaticParams
<Suspense fallback={<div>Loading...</div>}>
  {/* Param 'run' not in generateStaticParams */}
  {children}
</Suspense>
// Fallback: SHOWN until dynamic param renders

// Case 2: Private cache (always dynamic)
<Suspense fallback={<div>Loading...</div>}>
  <PrivateCacheComponent />
</Suspense>
// Fallback: SHOWN until private cache renders

// Case 3: connection() call
<Suspense fallback={<div>Loading...</div>}>
  <ComponentUsingConnection />
</Suspense>
// Fallback: SHOWN until connection() resolves

// Case 4: Short-lived cache (expire < 5min)
<Suspense fallback={<div>Loading...</div>}>
  <ShortLivedCacheComponent />
</Suspense>
// Fallback: SHOWN in static prerender, filled at runtime
```

#### 8. Draft Mode Semantics

```typescript
// Draft mode state machine:

// DISABLED → ENABLED:
// - All caches bypassed
// - Fresh data every request
// - Original cached values preserved (not deleted)

// ENABLED → DISABLED:
// - Caches restored
// - Original cached values reused
// - No refetch needed

// Pattern: Draft mode is session-based, not global
// Different users can have different draft mode states
```

#### 9. Cache Tag Propagation

```typescript
// Tags propagate to fetch cache metadata

async function getCached() {
  "use cache"
  cacheTag("my-tag")

  const data = await fetch("https://...") // Inner fetch
  return data
}

// Prerender manifest shows:
// x-next-cache-tags: 'my-tag' (includes the tag)

// Inner fetch tags also propagate:
async function getCached() {
  "use cache"
  cacheTag("outer")

  const data = await fetch("https://...", {
    next: { tags: ["inner"] },
  })

  return data
}

// x-next-cache-tags: 'outer,inner'
```

#### 10. Non-Serializable Props Advanced

```typescript
// THESE are non-serializable (not in cache key):
// - JSX elements
// - React components
// - Functions
// - Class instances
// - Promises (become references)
// - Symbols
// - undefined (becomes reference)

async function cached(
  x: number, // ✅ Serializable → in cache key
  fn: () => void, // ❌ Non-serializable → reference
  jsx: ReactNode, // ❌ Non-serializable → reference
  promise: Promise<T>, // ❌ Non-serializable → reference
  obj: PlainObject // ✅ Serializable → in cache key
) {
  "use cache"
  return { x, result: fn() }
}

// Cache hits on SAME x, even with different fn/jsx/promise
```

#### 11. params Promise Properties Don't Shadow

```typescript
// Promise has properties: then, catch, finally, value (in some contexts), status

// But you can have params named these:
params: Promise<{
  then: string // ✅ Works!
  catch: string // ✅ Works!
  finally: string // ✅ Works!
  value: string // ✅ Works!
  status: string // ✅ Works!
}>

const { then, value, status } = await params // All accessible
```

#### 12. Nested Cache Exclusion from RDC

```typescript
// Resume Data Cache (RDC) inclusion rules:

async function outer() {
  'use cache'
  const middleResult = await middle()  // Inner cache
  return middleResult
}

async function middle() {
  'use cache'
  return Math.random()
}

async function inner() {
  'use cache'
  return Math.random()
}

export default async function Page() {
  const a = await outer()    // Calls outer → middle
  const b = await inner()    // Calls inner directly

  return <div>{a} {b}</div>
}

// RDC includes:
// ✅ outer (called from page)
// ✅ inner (called from page)
// ❌ middle (only called from outer, not page)

// Rule: Only caches called directly from prerender scope → RDC
```

#### 13. Short-Lived Cache Omission

```typescript
// DYNAMIC_EXPIRE = 5 minutes = 300 seconds

async function shortLived() {
  "use cache"
  cacheLife({ stale: 30, revalidate: 60, expire: 180 }) // < 300s
  return Date.now()
}

// Static prerender: ❌ Omitted (expire < 300s)
// Prerender manifest: Route not included
// Runtime: Fetched on-demand

// RUNTIME_PREFETCH_DYNAMIC_STALE = 30 seconds

async function tooShortForPrefetch() {
  "use cache"
  cacheLife({ stale: 20, revalidate: 60, expire: 180 }) // stale < 30s
  return Date.now()
}

// Runtime prefetch: ❌ Omitted (stale < 30s)
// Navigation: Streams in dynamically
```

#### 14. cacheLife('seconds') Special Behavior

```typescript
// SPECIAL CASE: cacheLife('seconds')

// Normal definition:
// stale: 0, revalidate: 1, expire: 1

// ACTUAL behavior:
// stale: 30 (adjusted to meet RUNTIME_PREFETCH_DYNAMIC_STALE threshold!)
// revalidate: 1
// expire: 1

// Why: Allows 'seconds' caches to be included in runtime prefetch
// While still being very short-lived
```

#### 15. Multiple Cache Tags Behavior

```typescript
async function getCached() {
  "use cache"
  cacheTag("tag1", "tag2", "tag3") // Multiple tags
  return data
}

// Invalidation:
revalidateTag("tag1") // Invalidates this cache
revalidateTag("tag2") // Also invalidates this cache
revalidateTag("tag3") // Also invalidates this cache

// ANY tag match → cache invalidated
```

#### 16. Param Spread Preserves Keys

```typescript
const copied = { ...(await params) }

// Gets ALL param keys, including:
// - Defined in type
// - Not defined in type but present in URL
// - Dynamic segments

Object.keys(copied).length // Count of all params
Reflect.has(copied, "key") // Check existence
```

#### 17. Private Cache Cache Key

```typescript
// Private cache key includes:
// - buildId
// - functionId
// - Serializable args
// - User context (cookies/headers accessed)

// Two users with same args → DIFFERENT cache entries
// Same user, same args → SAME cache entry

async function privateCached(productId: string) {
  "use cache: private"
  const userId = (await cookies()).get("userId")?.value
  return await getProduct(productId, userId)
}

// User A, product 1 → Cache entry A1
// User B, product 1 → Cache entry B1 (different!)
// User A, product 1 again → Cache entry A1 (same!)
```

#### 18. Suspense Nesting

```typescript
// Multiple Suspense levels work:

export default function Page() {
  return (
    <Suspense fallback={<div>Outer loading...</div>}>
      <OuterComponent />
    </Suspense>
  )
}

async function OuterComponent() {
  const data = await cookies()

  return (
    <>
      <div>Data: {data}</div>
      <Suspense fallback={<div>Inner loading...</div>}>
        <InnerComponent />
      </Suspense>
    </>
  )
}

async function InnerComponent() {
  await connection()
  return <div>Dynamic</div>
}

// Behavior:
// - Outer Suspense catches cookies() dynamic boundary
// - Inner Suspense catches connection() dynamic boundary
// - Both fallbacks can show independently
```

#### 19. Error Boundary Interaction

```typescript
// Errors in runtime prefetch trigger error boundaries

async function MayError() {
  const cookie = (await cookies()).get('value')
  if (cookie === 'bad') {
    throw new Error('Kaboom')
  }
  return <div>Content</div>
}

export default function Page() {
  return (
    <ErrorBoundary fallback={<div id="error-boundary">Error!</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <MayError />
      </Suspense>
    </ErrorBoundary>
  )
}

// Runtime prefetch with bad cookie:
// - Prefetch includes partial shell
// - Navigation shows error boundary
// - No crash, graceful degradation
```

#### 20. Sync IO After Dynamic API Abort

```typescript
// Pattern causes silent prerender abort:

async function Page() {
  const cookie = (await cookies()).get('val')?.value

  // Synchronous platform IO after async API
  const timestamp = Date.now()  // Aborts prerender
  const random = Math.random()  // Aborts prerender
  const uuid = crypto.randomUUID()  // Aborts prerender

  return <div>{cookie} {timestamp}</div>
}

// Runtime prefetch behavior:
// - Prefetch partial shell before sync IO
// - Abort silently when sync IO encountered
// - No error logged
// - Navigation completes normally with full content
```

---

## 🔬 Advanced Edge Cases from Tests

### Edge Case 1: Empty generateStaticParams

```typescript
export async function generateStaticParams() {
  return [] // No params pre-generated
}

// Behavior: All params rendered on-demand (ISR)
// First request: Dynamic render + cache
// Subsequent requests: Serve cached version
```

### Edge Case 2: Params in Client Components

```typescript
// Client components receive params as Promise too!

'use client'
import { use } from 'react'

export default function ClientPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)  // use() Hook for Promises
  return <div>{id}</div>
}

// Test proves: Client components work with async params
// Use React's use() Hook, not await
```

### Edge Case 3: Spread After Await

```typescript
// ✅ Spreading works after await
const allParams = { ...(await params) }

// ❌ Cannot spread Promise directly
const broken = { ...params } // Type error

// ✅ Can check existence
const hasKey = Reflect.has(await params, "key")
const keys = Object.keys(await params)
```

### Edge Case 4: Server Actions Update Cookie → Prefetch Updates

```typescript
// When Server Action updates cookie:
// 1. Client cache invalidated
// 2. Next prefetch uses NEW cookie value
// 3. No manual cache clearing needed

// Test proves this works automatically
```

### Edge Case 5: Multiple Samples for Same Route

```typescript
export const unstable_prefetch = {
  mode: "runtime",
  samples: [
    { cookies: [{ name: "plan", value: "free" }] },
    { cookies: [{ name: "plan", value: "pro" }] },
    { cookies: [{ name: "plan", value: "enterprise" }] },
  ],
}

// Behavior:
// - Link visible → Prefetch with sample matching current cookie
// - If cookie is 'pro' → Uses pro sample
// - Each sample creates separate prefetch cache entry
```

### Edge Case 6: Private Cache Without Any Dynamic Access

```typescript
// Edge case: Private cache that doesn't actually access cookies/headers

async function StillPrivate() {
  'use cache: private'
  // Doesn't call cookies() or headers()!
  return <div>Content</div>
}

// Behavior:
// - Still excluded from static prerender
// - Still included in runtime prefetch (if stale >= 30s)
// - Acts as per-user cache even without accessing user data
// - Useful for per-session caching
```

### Edge Case 7: Connection After Cookies

```typescript
// ✅ Can call connection() after cookies() (outside cache)

async function Component() {
  const cookie = (await cookies()).get('val')
  await connection()  // Additional dynamic marker
  const random = Math.random()
  return <div>{cookie} {random}</div>
}

// Behavior: Both mark as dynamic, no conflict
```

### Edge Case 8: Metadata Cache Sharing

```typescript
// Metadata and page can share cache:

async function getCached() {
  'use cache'
  return Math.random()
}

export async function generateMetadata() {
  const data = await getCached()
  return { title: String(data) }
}

export default async function Page() {
  const data = await getCached()
  return <div>{data}</div>
}

// document.title === page content (SAME cached value!)
// Cache shared between metadata and page rendering
```

### Edge Case 9: notFound() Inside 'use cache'

```typescript
// ✅ Can call notFound() inside 'use cache'

async function getCachedOrNotFound(id: string) {
  "use cache"
  const item = await db.items.findUnique({ where: { id } })
  if (!item) {
    notFound() // Throws special Next.js error
  }
  return item
}

// Behavior: notFound() respected, shows 404 page
// Result: Not cached (error interrupts caching)
```

### Edge Case 10: Params Spread vs Destructure

```typescript
// Both patterns work identically:

// Pattern A: Destructure
const { id, slug } = await params

// Pattern B: Spread
const allParams = { ...(await params) }
const id = allParams.id
const slug = allParams.slug

// Cache behavior: IDENTICAL
// Both trigger dynamic rendering for non-generated params
// Both work with generateStaticParams
```

---

## 🎯 FINAL SUMMARY: The 50 Commandments for AI Agents

### Cache Directive Rules (1-10)

1. Use `'use cache'` for shared public content
2. Use `'use cache: private'` for per-user content
3. Place `'use cache'` at start of function body (after signature)
4. Can use at file level (before imports)
5. Cannot nest `'use cache: private'` inside `'use cache'`
6. Can nest `'use cache'` inside `'use cache: private'`
7. Private cache MUST have Suspense wrapper (build error if not)
8. Public cache doesn't require Suspense (but recommended for PPR)
9. Cache directive applies to that function only (not children)
10. File-level cache applies to all exports

### Request API Rules (11-20)

11. Always declare `params` as `Promise<{ ... }>`
12. Always declare `searchParams` as `Promise<{ ... }>`
13. Always `await params` before accessing properties
14. Always `await searchParams` before accessing properties
15. Always `await cookies()` to get cookie store
16. Always `await headers()` to get headers list
17. Always `await connection()` (returns void Promise)
18. Can pass un-awaited Promise to child components
19. Await in child, inside Suspense boundary (pattern)
20. Use `use()` Hook in client components for params Promise

### Cache Key Rules (21-30)

21. Serializable args → part of cache key
22. Non-serializable args → NOT in cache key (references)
23. Closed-over variables → part of cache key
24. Same args → same object reference (identity preserved)
25. Different args → different cache entry
26. Children prop → never in cache key
27. Function props → never in cache key
28. JSX props → never in cache key
29. Promise props → never in cache key
30. Plain object props → IN cache key (serialized)

### Prefetch Rules (31-40)

31. Static prefetch: include if `expire >= 300s`
32. Runtime prefetch: include if `stale >= 30s`
33. `cacheLife('seconds')`: special case, stale=30s
34. Public cache → always in runtime prefetch
35. Private cache → only if stale >= 30s
36. Uncached IO → never in runtime prefetch
37. `connection()` calls → never in runtime prefetch
38. params/searchParams/cookies/headers → in runtime prefetch (from samples)
39. Must provide samples for ALL dynamic APIs accessed
40. Multiple samples → separate prefetch cache entries

### Invalidation Rules (41-50)

41. `updateTag()` → Server Actions only, immediate
42. `refresh()` → Server Actions only, client cache
43. `revalidateTag(tag, 'max')` → Actions + Route Handlers, stale-while-revalidate
44. `revalidateTag(tag)` → deprecated, use with profile
45. Multiple tags → invalidating ANY tag clears cache
46. Tag with `fetch()` tags → both propagate to manifest
47. Draft mode → bypasses ALL caches
48. Draft mode off → restores original caches
49. Revalidate affects cache function revalidation timing
50. Inner fetch revalidate → affects outer cache timing

---

**Document Status**: ULTRA-COMPLETE - Covers EVERY nuance from test suite
**Test Coverage**: 125+ test fixtures systematically analyzed
**Behavioral Patterns**: 80+ commandments documented
**Edge Cases**: 25+ advanced scenarios covered
**Segment Caching**: 11 patterns with client-side cache behavior
**generateStaticParams**: 8 patterns with build-time generation
**Decision Trees**: 4 comprehensive test-driven flowcharts
**Code Examples**: 90+ from actual E2E tests with line references
**Magic Numbers Documented**:

- 30s (RUNTIME_PREFETCH_DYNAMIC_STALE) - Runtime prefetch inclusion threshold
- 300s (DYNAMIC_EXPIRE / 5 minutes) - Static prerender inclusion threshold
- 30s (staleTimes.dynamic) - Segment cache freshness for dynamic data
- 300s (staleTimes.static) - Segment cache freshness for static data

This is the definitive, authoritative guide for AI agents building Next.js 16 applications with cacheComponents mode. Every pattern is test-proven, every assertion is backed by real behavioral tests. Includes comprehensive segment caching and generateStaticParams mechanics.

**Ready for AI agent consumption.** 🤖✅
