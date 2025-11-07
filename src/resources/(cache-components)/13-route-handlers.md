# Route Handlers with Cache Components

## Overview

Route Handlers (`route.ts`/`route.js` files in `app/api/`) follow the same caching model as normal UI routes in your application. They are dynamic by default, can be pre-rendered when deterministic, and you can `use cache` to include more dynamic data in the cached response.

**Reference:** [Next.js Documentation - Route Handlers with Cache Components](https://nextjs.org/docs/app/getting-started/cache-components#route-handlers-with-cache-components)

---

## Critical Rule: `use cache` Cannot Be Used Directly in Route Handler Body

**⚠️ CRITICAL:** `use cache` **MUST** be extracted to a helper function - it cannot be used directly in the Route Handler function body.

**Why:** Response objects (`Response.json()`, `NextResponse`, etc.) cannot be directly serialized for caching. The cached function must return serializable data (objects, arrays, primitives), not Response objects.

---

## Route Handler Behavior

1. **Dynamic by default:** Route Handlers are dynamic by default (like all routes with Cache Components)
2. **Pre-rendering:** Static handlers (no dynamic data) will be pre-rendered at build time
3. **Caching:** Extract data fetching to a helper function with `use cache` to cache the data
4. **Runtime APIs:** Using `cookies()`, `headers()`, or `connection()` defers to request time (no pre-rendering)

---

## Examples

### Dynamic Route Handler (Returns Different Value Per Request)

A handler that returns a different number for every request:

```typescript
// app/api/random-number/route.ts
export async function GET() {
  return Response.json({
    randomNumber: Math.random(),
  })
}
```

**Behavior:** This handler is dynamic and executes at request time, returning a fresh random number for each request.

---

### Static Route Handler (Pre-rendered at Build Time)

A handler that returns only static data will be pre-rendered at build time:

```typescript
// app/api/project-info/route.ts
export async function GET() {
  return Response.json({
    projectName: 'Next.js',
  })
}
```

**Behavior:** This handler contains no dynamic data, so it will be pre-rendered at build time and served as a static response.

---

### Cached Route Handler (Caches Database Query)

If you have a route that returns fresh dynamic data on every request, say products from a database:

```typescript
// ❌ INCORRECT: Direct use in handler body
// app/api/products/route.ts
import { cacheLife } from 'next/cache'

export async function GET() {
  'use cache'  // ❌ ERROR: Cannot serialize Response
  cacheLife('hours')
  
  const products = await db.query('SELECT * FROM products')
  return Response.json(products)  // Response cannot be cached
}
```

**Correct Pattern - Extract to Helper:**

```typescript
// ✅ CORRECT: Extract data fetching to helper function
// app/api/products/route.ts
import { cacheLife } from 'next/cache'

export async function GET() {
  const products = await getProducts()
  
  return Response.json(products)
}

// Helper function with "use cache"
async function getProducts() {
  'use cache'
  cacheLife('hours')
  
  return await db.query('SELECT * FROM products')
}
```

**How It Works:**
- The `getProducts()` helper function contains the `'use cache'` directive
- The database query is cached for the duration specified by `cacheLife('hours')`
- The Route Handler calls the cached helper and wraps the result in `Response.json()`
- Cached responses revalidate according to `cacheLife` when a new request arrives

---

## Migration Checklist for Route Handlers

When migrating Route Handlers to Cache Components:

- [ ] **Identify data fetching:** Find all database queries, API calls, or data operations
- [ ] **Extract to helper:** Move data fetching to a separate async function
- [ ] **Add `use cache`:** Add `'use cache'` directive to the helper function (NOT the handler)
- [ ] **Configure cacheLife:** Add `cacheLife()` with appropriate duration
- [ ] **Keep Response in handler:** Return `Response.json()` or `NextResponse` in the handler body
- [ ] **Test caching:** Verify cached responses revalidate according to `cacheLife` when new requests arrive

---

## Common Mistakes

### ❌ Mistake 1: Putting `use cache` in Handler Body

```typescript
// ❌ INCORRECT
export async function GET() {
  'use cache'  // ERROR: Cannot serialize Response
  cacheLife('hours')
  
  const data = await db.query('SELECT * FROM products')
  return Response.json(data)
}
```

**Error:** Response objects cannot be serialized for caching. This will cause a build or runtime error.

**Fix:** Extract data fetching to a helper function.

---

### ❌ Mistake 2: Caching Response Objects

```typescript
// ❌ INCORRECT
async function getResponse() {
  'use cache'
  return Response.json({ data: 'value' })  // Cannot cache Response
}
```

**Error:** Only cache the data, not the Response wrapper.

**Fix:** Return the data from the cached function, then wrap it in `Response.json()` in the handler.

---

### ❌ Mistake 3: Forgetting cacheLife

```typescript
// ⚠️ WARNING: Will cache forever
async function getProducts() {
  'use cache'  // No cacheLife - caches forever
  return await db.query('SELECT * FROM products')
}
```

**Issue:** Without `cacheLife()`, cached data will cache forever by default.

**Fix:** Always add `cacheLife()` with an appropriate duration based on your content update frequency.

---

### ✅ Correct Pattern

```typescript
// ✅ CORRECT: Extract data to helper, cache the data, return Response in handler
import { cacheLife } from 'next/cache'

export async function GET() {
  const products = await getProducts()
  return Response.json(products)
}

async function getProducts() {
  'use cache'
  cacheLife('hours')  // Set appropriate cache duration
  return await db.query('SELECT * FROM products')
}
```

---

## Using Runtime APIs in Route Handlers

**Important Notes:**

- Using runtime APIs like `cookies()` or `headers()`, or calling `connection()`, always defers to request time (no pre-rendering)
- If you need to use these APIs, the handler will be dynamic
- You can still cache the data fetching part by extracting it to a helper function

**Example with cookies():**

```typescript
// app/api/user-data/route.ts
import { cookies } from 'next/headers'
import { cacheLife } from 'next/cache'

export async function GET() {
  const session = (await cookies()).get('session')?.value
  
  // Cache the database query, but handler is dynamic due to cookies()
  const userData = await getUserData(session)
  
  return Response.json(userData)
}

async function getUserData(session: string | undefined) {
  'use cache'
  cacheLife('minutes')  // Cache user data for a short duration
  
  // Use session in query
  return await db.query('SELECT * FROM users WHERE session = ?', [session])
}
```

**Behavior:** The handler is dynamic (due to `cookies()`), but the database query is cached, reducing database load while still serving user-specific data.

---

## Best Practices

1. **Always extract data fetching:** Move any data operations to helper functions when using `use cache`
2. **Set appropriate cacheLife:** Choose cache duration based on content update frequency
3. **Use cache tags for on-demand revalidation:** Consider using `cacheTag()` if you need to invalidate cache on specific events
4. **Keep handlers simple:** Route handlers should primarily orchestrate data fetching and return responses
5. **Document cache behavior:** Add comments explaining why and how long data is cached

---

## Summary

- Route Handlers follow the same caching model as UI routes
- `use cache` **MUST** be extracted to a helper function (cannot be used in handler body)
- Response objects cannot be serialized - only cache the data, not the Response wrapper
- Always configure `cacheLife()` to control cache duration
- Runtime APIs (`cookies()`, `headers()`, `connection()`) make handlers dynamic but data can still be cached

