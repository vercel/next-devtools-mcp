# Cache Components Mode: The Complete AI Agent Guide

## Authoritative Reference Based on E2E Test Suite Patterns

**Document Version**: 3.0 - E2E Test-Driven Edition
**Target**: Next.js 15.6+ / 16.0.0-canary with `experimental.cacheComponents: true`
**Source**: Derived from 125+ E2E test fixtures and behavioral assertions
**Last Updated**: January 2025

**⚠️ SCOPE**: This guide covers Cache Components mode (`experimental.cacheComponents: true`). These rules do NOT apply to standard Next.js 16 without Cache Components enabled.

---

## 🎯 What AI Agents Get Wrong (And Why)

Based on analyzing the complete E2E test suite, AI agents consistently make these mistakes **when Cache Components is enabled**:

### ❌ **CRITICAL ERRORS AI AGENTS MAKE (with cacheComponents enabled):**

1. **Using `loading.tsx` for loading states** (deprecated for PPR shell generation)
2. **Using `export const dynamic = 'force-static'`** (completely incompatible with cacheComponents)
3. **Using `export const fetchCache`** (raises build error with cacheComponents)
4. **Using `export const revalidate`** (raises build error with cacheComponents)
5. **Using `export const dynamicParams`** (raises build error with cacheComponents)
6. **Using `export const runtime`** (raises build error when incompatible with cacheComponents)
7. **Accessing `cookies()`/`headers()` in `'use cache'`** (throws runtime error)
8. **Using `'use cache: private'` without `<Suspense>`** (build error)
9. **Using `connection()` inside any cache scope** (throws error)
10. **Not awaiting `params` and `searchParams`** (type error in Next.js 15)
11. **Using `revalidateTag()` without the `profile` parameter** (deprecated)
12. **Passing non-serializable props to cached components** (cache key issues)
13. **Using `unstable_ViewTransition`** (renamed to `ViewTransition` in Next.js 16)
14. **Using empty `await headers()` or `await cookies()` calls just to mark component as dynamic** (anti-pattern - use `await connection()` instead)

---

## 📘 Table of Contents

### Part 1: Core Mechanics

1. [The Fundamental Paradigm Shift](#paradigm-shift)
2. [How cacheComponents Changes Everything](#how-it-works)
3. [The Three Types of Rendering](#three-types)

### Part 2: Public Caches (`'use cache'`)

4. [Public Cache Mechanics](#public-cache)
5. [Cache Key Generation (Critical!)](#cache-keys)
6. [Non-Serializable Props Pattern](#non-serializable)
7. [Nested Public Caches](#nested-public)

### Part 3: Private Caches (`'use cache: private'`)

8. [Private Cache Mechanics](#private-cache)
9. [When Private Cache is Included/Excluded](#private-inclusion)
10. [Private Cache Patterns from Tests](#private-patterns)

### Part 4: Runtime Prefetching

11. [unstable_prefetch Configuration](#unstable-prefetch)
12. [Runtime Prefetch Sample Patterns](#prefetch-samples)
13. [What Gets Included in Runtime Prefetch](#prefetch-inclusion)
14. [Stale Time Thresholds (30s Rule)](#stale-thresholds)

### Part 5: Link Prefetching

15. [Link prefetch Modes](#link-prefetch)
16. [prefetch="unstable_forceStale" Deep Dive](#force-stale)
17. [unstable_dynamicOnHover](#dynamic-on-hover)

### Part 6: Request APIs

18. [Async params Semantics](#params-semantics)
19. [searchParams Behavior](#searchparams-behavior)
20. [cookies() and headers() Patterns](#cookies-headers)
21. [connection() Deep Dive](#connection-api)

### Part 7: Cache Invalidation

22. [updateTag() - Read-Your-Own-Writes](#update-tag)
23. [revalidateTag(tag, profile) - New Signature](#revalidate-tag)
24. [refresh() - Client Router Cache](#refresh-api)
25. [Granular Invalidation Strategies](#granular-invalidation)

### Part 8: Advanced Patterns

26. [cacheLife() Profiles and Custom Config](#cache-life)
27. [cacheTag() Multi-Tag Patterns](#cache-tag)
28. [Draft Mode Behavior](#draft-mode)
29. [generateStaticParams Integration](#generate-static-params)
30. [Math.random() and Date.now() Patterns](#random-patterns)

### Part 9: Build Behavior

31. [What Gets Prerendered](#prerendering)
32. [Resume Data Cache (RDC)](#resume-data-cache)
33. [Static Shell vs Dynamic Holes](#shells-and-holes)
34. [generateMetadata and generateViewport](#metadata-viewport)

### Part 10: Error Patterns

35. [Segment Config Errors](#segment-config-errors)
36. [Dynamic Metadata Errors](#dynamic-metadata-errors)
37. [Missing Suspense Errors](#missing-suspense)
38. [Sync IO After Dynamic API Errors](#sync-io-errors)

### Part 11: Real Test-Driven Patterns

39. [Complete E2E Pattern Library](#pattern-library)
40. [Decision Trees Based on Tests](#decision-trees)

---
