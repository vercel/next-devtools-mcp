# Next.js 16 Beta to Stable Migration Guide

## Overview

This guide covers the specific breaking changes when migrating from **Next.js 16.0.0-beta** to **Next.js 16.0.0 stable**.

If you're already on Next.js 16 beta and upgrading to stable, you need to apply these additional migrations that were stabilized between beta and stable releases:

1. **Config Migration**: `experimental.cacheLife` → `cacheLife` (move to top-level)
2. **API Stabilization**: `unstable_cacheLife()` → `cacheLife()` (remove unstable prefix)

## Required Migrations

### 1. experimental.cacheLife → cacheLife

**Status**: BREAKING - Required for beta → stable migration

The `cacheLife` configuration has been moved out of the `experimental` object and is now a top-level config option.

**File**: `next.config.js` or `next.config.ts`

**Migration**:

```diff
// next.config.js
export default {
-   experimental: {
-     cacheLife: {
-       default: { stale: 3600, revalidate: 900, expire: 86400 },
-       custom: { stale: 1800, revalidate: 450, expire: 43200 },
-     },
-   },
+   cacheLife: {
+     default: { stale: 3600, revalidate: 900, expire: 86400 },
+     custom: { stale: 1800, revalidate: 450, expire: 43200 },
+   },
}
```

**Why this matters**:
- Projects using Cache Components with custom `cacheLife` profiles will fail to recognize the config if it's still under `experimental`
- The stable release expects `cacheLife` at the top level

**How to find**:
```bash
# Search for experimental.cacheLife in your config
grep -r "experimental.*cacheLife" .
# or
rg "experimental.*cacheLife"
```

### 2. unstable_cacheLife() → cacheLife()

**Status**: BREAKING - Required for beta → stable migration

The `unstable_cacheLife` function has been stabilized and renamed to `cacheLife`.

**Files**: All components and functions using `unstable_cacheLife`

**Migration**:

```diff
- import { unstable_cacheLife } from 'next/cache'
+ import { cacheLife } from 'next/cache'

  export async function MyComponent() {
-   unstable_cacheLife('hours')
+   cacheLife('hours')

    const data = await fetchData()
    return <div>{data}</div>
  }
```

**Why this matters**:
- The `unstable_` prefix has been removed as the API is now stable
- Projects using `unstable_cacheLife` will get import errors in stable

**How to find**:
```bash
# Search for unstable_cacheLife usage in your codebase
grep -r "unstable_cacheLife" app/ src/
# or
rg "unstable_cacheLife"
```

**Automated fix**:
```bash
# Use find and replace across all files
find app src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' 's/unstable_cacheLife/cacheLife/g' {} +
```

### 3. experimental.cacheComponents remains experimental

**Status**: Still experimental in stable

The `experimental.cacheComponents` flag itself **remains experimental** and should stay under the `experimental` object.

```js
// next.config.js
export default {
  experimental: {
    cacheComponents: true, // ✅ Keep this in experimental
  },
  cacheLife: {
    // ✅ Move this to top-level
    default: { stale: 3600, revalidate: 900, expire: 86400 },
  },
}
```

## Detection Checklist

Run this checklist to verify your migration:

- [ ] Searched for `experimental.cacheLife` in `next.config.js`/`next.config.ts`
- [ ] Moved `cacheLife` object to top-level if found
- [ ] Searched for `unstable_cacheLife` imports and usages in codebase
- [ ] Renamed all `unstable_cacheLife` to `cacheLife`
- [ ] Verified `experimental.cacheComponents` remains in experimental (don't move this)
- [ ] Tested dev server starts without config errors
- [ ] Verified custom cacheLife profiles are recognized
- [ ] Verified no import errors for `cacheLife` function

## Complete Example

**Before (Next.js 16 beta)**:
```js
// next.config.js
export default {
  experimental: {
    cacheComponents: true,
    cacheLife: {
      default: {
        stale: 3600,
        revalidate: 900,
        expire: 86400,
      },
      blog: {
        stale: 1800,
        revalidate: 600,
        expire: 43200,
      },
    },
  },
}
```

```tsx
// app/blog/page.tsx
import { unstable_cacheLife } from 'next/cache'

export default async function BlogPage() {
  unstable_cacheLife('blog')

  const posts = await fetchPosts()
  return <div>{posts.map(post => <Post key={post.id} {...post} />)}</div>
}
```

**After (Next.js 16 stable)**:
```js
// next.config.js
export default {
  experimental: {
    cacheComponents: true, // Stays here
  },
  cacheLife: {
    // Moved to top-level
    default: {
      stale: 3600,
      revalidate: 900,
      expire: 86400,
    },
    blog: {
      stale: 1800,
      revalidate: 600,
      expire: 43200,
    },
  },
}
```

```tsx
// app/blog/page.tsx
import { cacheLife } from 'next/cache'

export default async function BlogPage() {
  cacheLife('blog')

  const posts = await fetchPosts()
  return <div>{posts.map(post => <Post key={post.id} {...post} />)}</div>
}
```

## Additional Notes

- These migrations are **only required** if you're upgrading from Next.js 16 beta to stable
- If you're upgrading from Next.js 15 or earlier directly to 16 stable, this doesn't apply (since you wouldn't have `experimental.cacheLife` or `unstable_cacheLife` yet)
- The codemod `@next/codemod@canary upgrade latest` does NOT handle these migrations automatically
- Errors you might see if not migrated:
  - Config: Custom cacheLife profiles not being applied, or config validation warnings
  - API: `Cannot find module 'next/cache' or its corresponding type declarations` for `unstable_cacheLife`
  - Runtime: Import errors when trying to use `unstable_cacheLife`

## Related Changes

For other Next.js 16 upgrade requirements, see:
- `experimental.serverComponentsExternalPackages` → `serverComponentsExternalPackages` (top-level)
- Async params/searchParams
- Config location migrations
- Image defaults changes
