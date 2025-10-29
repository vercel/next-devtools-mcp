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
