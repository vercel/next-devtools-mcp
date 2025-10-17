## <a id="private-cache"></a>8. Private Cache Mechanics

### Pattern from Tests: Private Cache Structure

**Test Source**: `test/e2e/app-dir/use-cache-private/app/cookies/page.tsx`

```typescript
// THE EXACT PATTERN FROM TESTS:

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

  return (
    <pre>
      test-cookie: <span id="test-cookie">{headers['x-test-cookie'] || '<empty>'}</span>
    </pre>
  )
}

// TEST BEHAVIOR:
// 1. Set cookie to 'foo'
// 2. Page displays: 'foo'
// 3. Change cookie to 'bar'
// 4. Refresh page
// 5. Page displays: 'bar' (per-user cache updated!)
```

### Private Cache Rules from Tests:

1. **MUST be wrapped in Suspense** (build error if not)
2. **Can access cookies()** ✅
3. **Can access headers()** ✅
4. **Can access searchParams** ✅
5. **Can access params** ✅
6. **CANNOT use connection()** ❌ (throws error)
7. **Excluded from static prerender** (always dynamic)
8. **Included in runtime prefetch** (if stale >= 30s)

---

## <a id="private-inclusion"></a>9. When Private Cache is Included/Excluded

### Test Pattern: Stale Time Threshold

**Test Source**: `test/e2e/app-dir/segment-cache/prefetch-runtime/prefetch-runtime.test.ts` (lines 752-1030)

```typescript
// CRITICAL THRESHOLD: 30 seconds (RUNTIME_PREFETCH_DYNAMIC_STALE)

// Pattern 1: Private cache with cacheLife('seconds')
async function ShortLivedCache() {
  'use cache: private'
  cacheLife('seconds')  // stale: 0, revalidate: 1, expire: 1
  // ... BUT cacheLife('seconds') is special: stale is set to 30s!

  return <div id="cached-value">{Date.now()}</div>
}

// TEST BEHAVIOR:
// Static prefetch: ❌ NOT included (expire < 5min)
// Runtime prefetch: ✅ INCLUDED (stale = 30s, meets 30s threshold)

// Pattern 2: Private cache with short stale time
async function TooShort() {
  'use cache: private'
  cacheLife({ stale: 20, revalidate: 100, expire: 200 })
  return <div>{Date.now()}</div>
}

// TEST BEHAVIOR:
// Static prefetch: ❌ NOT included (expire < 5min)
// Runtime prefetch: ❌ NOT included (stale < 30s)
// Navigation: Fetched at request time
```

### Inclusion Matrix from Tests:

| Cache Type | Stale Time | Expire Time | Static Prefetch | Runtime Prefetch |
| ---------- | ---------- | ----------- | --------------- | ---------------- |
| Public     | Any        | >= 5min     | ✅ Included     | ✅ Included      |
| Public     | >= 30s     | < 5min      | ❌ Excluded     | ✅ Included      |
| Public     | < 30s      | < 5min      | ❌ Excluded     | ❌ Excluded      |
| Private    | >= 30s     | Any         | ❌ Excluded     | ✅ Included      |
| Private    | < 30s      | Any         | ❌ Excluded     | ❌ Excluded      |

---
