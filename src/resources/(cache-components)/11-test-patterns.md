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
