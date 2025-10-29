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
