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
