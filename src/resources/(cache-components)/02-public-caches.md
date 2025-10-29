## <a id="public-cache"></a>4. Public Cache Mechanics

### Pattern 1: Function-Level 'use cache'

```typescript
// Test Source: test/e2e/app-dir/use-cache/app/(partially-static)/cache-life/page.tsx

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
//
// NOTE: 'use cache' is at FUNCTION level, not file level
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
