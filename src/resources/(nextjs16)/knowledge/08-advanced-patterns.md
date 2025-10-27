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
