# Next.js 16 Critical Migration Rules

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

### Image Defaults Changed (No Action Needed)
These changed automatically - override if needed:
- `minimumCacheTTL`: 60s → 14400s (4 hours)
- `qualities`: [1..100] → [75]
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
```typescript
// ❌ OLD
import { unstable_ViewTransition } from 'react'

// ✅ NEW
import { ViewTransition } from 'react'
```

### Middleware Deprecation
```typescript
// ⚠️ DEPRECATED (still works, warning only)
// middleware.ts

// ✅ RECOMMENDED
// proxy.ts
```

## 📁 Parallel Routes Requirement

If you have `@modal`, `@auth`, etc. folders:

```typescript
// MUST create: app/@modal/default.tsx
export default function Default() {
  return null
}
```

## 🛡️ Image Security

If using local images with query strings:

```typescript
// next.config.js
export default {
  images: {
    localPatterns: [{ pathname: '/img/**' }]
  }
}
```

## 🧪 Common Edge Cases

### Destructuring in Function Signature
```typescript
// ❌ WILL BREAK
export default async function Page({ params }) {
  // params is still a Promise here!
}

// ✅ CORRECT
export default async function Page(props) {
  const params = await props.params
}
```

### Nested Access
```typescript
// ❌ WILL BREAK
export default async function Page({ params: { slug } }) {
  // Cannot destructure Promise
}

// ✅ CORRECT
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
    // ...
  }
}
```

## 📝 Quick Checklist

**For every file with these patterns, make it async and await:**

- [ ] `function Page({ params })` → `async function Page(props)` + `await props.params`
- [ ] `function Page({ searchParams })` → `async function Page(props)` + `await props.searchParams`
- [ ] `function Layout({ params })` → `async function Layout(props)` + `await props.params`
- [ ] `generateMetadata({ params })` → `async generateMetadata(props)` + `await props.params`
- [ ] `generateViewport({ params })` → `async generateViewport(props)` + `await props.params`
- [ ] `cookies().get()` → `(await cookies()).get()`
- [ ] `headers().get()` → `(await headers()).get()`
- [ ] `draftMode().isEnabled` → `(await draftMode()).isEnabled`
- [ ] `revalidateTag(tag)` → `updateTag(tag, 'max')` or `revalidateTag(tag, 'max')`

**Config changes:**
- [ ] Add `default.tsx` for all parallel route `@` folders
- [ ] Update `unstable_ViewTransition` → `ViewTransition`
- [ ] Review image config defaults (if using local images with query strings)

---

**For detailed examples and test patterns, load these resources:**
- `nextjs16://knowledge/request-apis` - Detailed async API patterns
- `nextjs16://knowledge/cache-invalidation` - updateTag vs revalidateTag semantics
- `nextjs16://knowledge/error-patterns` - Common build/runtime errors
