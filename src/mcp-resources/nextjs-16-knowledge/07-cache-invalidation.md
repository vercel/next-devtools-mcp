## <a id="update-tag"></a>22. updateTag() - Read-Your-Own-Writes

### Test Pattern: Immediate Cache Invalidation

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/cache-tag/buttons.tsx` + test assertions

```typescript
"use server"

import { updateTag, revalidateTag } from "next/cache"

export async function revalidateA() {
  revalidateTag("a")
}

export async function revalidateB() {
  revalidateTag("b")
}

export async function revalidateC() {
  revalidateTag("c")
}

// Page uses getCachedWithTag({ tag: 'a' }) and ({ tag: 'b' })
// Both also use cacheTag(tag, 'c')

// TEST BEHAVIOR (lines 223-315):
// Initial: valueA = 0.123, valueB = 0.456
//
// Call revalidateA():
// - valueA changes to 0.789
// - valueB stays 0.456
//
// Call revalidateC():
// - valueA changes (has tag 'c')
// - valueB changes (has tag 'c')
//
// This proves: Tags work as expected for granular invalidation
```

---

## <a id="revalidate-tag"></a>23. revalidateTag(tag, profile) - New Signature

### Test Pattern: Profile Parameter

**Test Source**: Documentation and recent commits show new signature

```typescript
'use server'

import { revalidateTag } from 'next/cache'

// ✅ NEW RECOMMENDED PATTERN:
export async function updateProductList() {
  await db.products.update(...)
  revalidateTag('products', 'max')  // Stale-while-revalidate
}

// ❌ DEPRECATED (but still works):
export async function oldPattern() {
  revalidateTag('products')  // No profile = legacy behavior
}

// Test from use-cache.test.ts (lines 223-314):
// - Revalidate specific tags
// - Cache updates happen async
// - Stale content served while revalidating (with 'max' profile)
```

---

## <a id="refresh-api"></a>24. refresh() - Client Router Cache

### Test Pattern: In-Place Page Update

**Test Source**: `test/e2e/app-dir/use-cache/app/(partially-static)/form/page.tsx`

```typescript
'use cache'
import { cacheLife, cacheTag } from 'next/cache'

async function getTime() {
  'use cache'
  cacheTag('time')
  cacheLife('hours')
  return Date.now()
}

export default async function Page() {
  const time = await getTime()

  return (
    <>
      <p id="t">{time}</p>
      <form action={async () => {
        'use server'
        await revalidateTag('time')
        refresh()  // ← Refresh current page
      }}>
        <button id="refresh" type="submit">Refresh</button>
      </form>
    </>
  )
}

// TEST BEHAVIOR (lines 612-633):
// 1. Initial load: time1 = 1234567890
// 2. Reload page: time2 = 1234567890 (same, cached)
// 3. Click refresh button:
//    - revalidateTag('time') called
//    - refresh() called
//    - Page updates in place
// 4. Check time: time3 ≠ time2 (updated!)
```

---
