# Next.js 16 Beta to Stable Migration Guide

## Overview

This guide covers the specific breaking changes when migrating from **Next.js 16.0.0-beta** to **Next.js 16.0.0 stable**.

If you're already on Next.js 16 beta and upgrading to stable, you need to apply these additional config migrations that were stabilized between beta and stable releases.

## Required Config Migrations

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

### 2. experimental.cacheComponents remains experimental

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
- [ ] Verified `experimental.cacheComponents` remains in experimental (don't move this)
- [ ] Tested dev server starts without config errors
- [ ] Verified custom cacheLife profiles are recognized

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

## Additional Notes

- This migration is **only required** if you're upgrading from Next.js 16 beta to stable
- If you're upgrading from Next.js 15 or earlier directly to 16 stable, this doesn't apply (since you wouldn't have `experimental.cacheLife` yet)
- The codemod `@next/codemod@canary upgrade latest` does NOT handle this migration automatically
- Error you might see if not migrated: Custom cacheLife profiles not being applied, or config validation warnings

## Related Changes

For other Next.js 16 upgrade requirements, see:
- `experimental.serverComponentsExternalPackages` → `serverComponentsExternalPackages` (top-level)
- Async params/searchParams
- Config location migrations
- Image defaults changes
