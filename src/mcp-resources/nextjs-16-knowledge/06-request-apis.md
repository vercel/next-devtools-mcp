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

### ⭐ When to Use connection()

**Official Purpose** ([Next.js Docs](https://nextjs.org/docs/app/api-reference/functions/connection)):
> The `connection()` function allows you to indicate rendering should wait for an incoming user request before continuing.
> 
> It's useful when a component doesn't use Dynamic APIs, but you want it to be dynamically rendered at runtime and not statically rendered at build time. This usually occurs when you access external information that you intentionally want to change the result of a render, such as `Math.random()` or `new Date()`.

**Use connection() to explicitly mark a component as dynamic:**

```typescript
import { connection } from 'next/server'

export default async function Page() {
  await connection()  // ✅ Marks component as dynamic
  
  const currentYear = new Date().getFullYear()
  const random = Math.random()
  
  return <div>{currentYear} - {random}</div>
}
```

**Key Points:**
- `connection()` replaces `unstable_noStore` (stabilized in Next.js 15)
- Only necessary when dynamic rendering is required and common Dynamic APIs (`headers()`, `cookies()`, `draftMode()`) are NOT used
- Perfect for `Math.random()`, `Date.now()`, or any time-based/random rendering

### ❌ Anti-Pattern: Empty headers()/cookies() Calls

**WRONG - Do NOT do this:**

```typescript
import { headers } from 'next/headers'

export default async function Footer() {
  await headers()  // ❌ BAD - Using as side effect just to mark dynamic
  
  const currentYear = new Date().getFullYear()
  return <footer>{currentYear}</footer>
}
```

**Why it's bad:**
- Not semantically correct (you're not using headers)
- Misleading to other developers
- Future readers think you need headers data

**RIGHT - Use connection() instead:**

```typescript
import { connection } from 'next/server'

export default async function Footer() {
  await connection()  // ✅ GOOD - Clear intent to mark as dynamic
  
  const currentYear = new Date().getFullYear()
  return <footer>{currentYear}</footer>
}
```

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
