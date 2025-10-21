## <a id="bundler-layer"></a>0. The App Router Bundler Layer (Critical Context)

### Understanding the Server Bundle Architecture

**Important**: In Next.js App Router, many types of server-only code compile to the same server bundle:
- Server components (pages, layouts)
- Route handlers (`app/route.ts`)
- Instrumentation (`instrumentation.ts`)
- Proxy (`proxy.ts`, formerly `middleware.ts`)
- Server Actions (in client/server components)

**However, they execute in different contexts** - this is the KEY distinction:

```
┌──────────────────────────────────────────────────────────────┐
│ SAME SERVER BUNDLE (all "server-only" code)                 │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ REACT RENDERING LAYER                                   │  │
│ │ (Component tree execution during prerender/streaming)   │  │
│ │                                                          │  │
│ │ - Server Components (pages, layouts)                    │  │
│ │ - Can use: 'use cache', cacheLife(), cacheTag()       │  │
│ │ - Participates in: PPR, static shell generation         │  │
│ │ - Can be prerendered at build time                      │  │
│ │ - Streaming: Yes, with Suspense fallbacks              │  │
│ │                                                          │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ HTTP REQUEST HANDLER LAYER                              │  │
│ │ (Request-time only execution, outside React tree)       │  │
│ │                                                          │  │
│ │ - Route Handlers (GET, POST, PUT, DELETE)              │  │
│ │ - Cannot use: 'use cache' (not part of React tree)     │  │
│ │ - Uses: revalidateTag(), HTTP cache headers             │  │
│ │ - Participates in: HTTP caching only                    │  │
│ │ - Cannot be prerendered (request-time only)             │  │
│ │ - Streaming: Native HTTP Response streaming             │  │
│ │                                                          │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ INITIALIZATION LAYER                                    │  │
│ │ (Server startup, lifecycle hooks)                       │  │
│ │                                                          │  │
│ │ - Instrumentation (one-time on server start)            │  │
│ │ - Cannot use: 'use cache' (not request-scoped)         │  │
│ │ - Participates in: Global state initialization          │  │
│ │ - Pre-request setup: Yes                               │  │
│ │ - Streaming: N/A (not request-scoped)                  │  │
│ │                                                          │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ EDGE PROXY LAYER                                        │  │
│ │ (Pre-request processing at edge/origin)                 │  │
│ │                                                          │  │
│ │ - Proxy (optional, runs before route handlers)          │  │
│ │ - Cannot use: 'use cache' (request rewriting layer)     │  │
│ │ - Uses: Response modification, redirects                │  │
│ │ - Participates in: Request routing/transformation       │  │
│ │ - Prerender: N/A (edge layer)                          │  │
│ │ - Streaming: Limited (request filter/transform layer)  │  │
│ │                                                          │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Why This Matters for Cache Components

**`'use cache'` is a React-level caching directive**, designed specifically for:
1. **Component tree execution** - renders JSX output
2. **Build-time analysis** - Partial Prerendering discovers caches at build time
3. **Streaming integration** - Works with Suspense boundaries and server streaming
4. **Cache key generation** - Serializes component props to create deterministic cache keys

**Route handlers operate at a different layer**:
- Execute **only at request time** (not during prerender)
- Return **Response objects** (not JSX/component output)
- Cannot participate in **static shell generation**
- Use **HTTP-level caching** (revalidateTag, cache headers, ISR)

### The Critical Insight

```typescript
// ✅ SERVER COMPONENTS: Part of component tree, prerenderable
export default async function Page() {
  'use cache'  // Belongs here - part of React rendering
  return <div>Content</div>
}

// ❌ ROUTE HANDLERS: Not part of component tree, request-only
export async function GET(request: Request) {
  // 'use cache' doesn't belong here - not React rendering
  // Use revalidateTag() instead
  return Response.json({ data: 'value' })
}

// ❌ INSTRUMENTATION: Not request-scoped, startup-only
export async function register() {
  // 'use cache' doesn't belong here - not a request handler
  // Use global state / service initialization instead
}
```

### Bundler Layer vs Execution Context

| Code Type | Bundled To | Execution Context | Cache Model | Prerenderable |
|-----------|-----------|-------------------|------------|---------------|
| Server Component | Server | React tree (build + request) | `'use cache'` | ✅ Yes |
| Route Handler | Server | HTTP request-time | `revalidateTag()` | ❌ No |
| Server Action | Server | RPC call from client | `updateTag()` | ❌ No |
| Instrumentation | Server | Startup hook | Global state | ❌ No |
| Proxy/Middleware | Edge/Server | Request transform | Response headers | ❌ No |

**Key Takeaway**: Being in the same "server bundle" doesn't mean they use the same caching model. The bundler layer is just where code lives; the execution context determines which caching APIs are available.

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
