# Complete Guide to "use client" Directive

This guide explains when, why, and how to use the `'use client'` directive in Next.js and React Server Components applications.

## What is "use client"?

The `'use client'` directive marks code to run on the client in React Server Components applications. It establishes a server-client boundary in your module dependency tree, creating a subtree of client modules.

**Key principle**: By default, all components are Server Components. You only need `'use client'` where you need client-side features.

---

## When to Use "use client"

### ✅ DO Use "use client" When You Need:

1. **Interactivity & State**
   - `useState` hook for component state
   - Event handlers (`onClick`, `onChange`, `onSubmit`, etc.)
   - Component-level state management

2. **React Hooks**
   - `useEffect` for side effects
   - `useContext` for context API
   - `useRef`, `useReducer`, `useCallback`, `useMemo`, etc.
   - Most hooks only work on the client (except `use` and `useId`)

3. **Browser APIs**
   - DOM manipulation
   - `localStorage`, `sessionStorage`
   - `window`, `document` objects
   - Audio/video APIs
   - Geolocation, camera, sensors

4. **Third-Party Libraries**
   - Libraries that use `createContext`
   - Components with `forwardRef` or `memo`
   - Any library requiring browser APIs
   - React Query, SWR, and other client-side data fetching libraries

### ❌ DON'T Use "use client" When:

- Component only renders static UI
- Data fetching is the only "work" needed (fetch on server instead)
- You only need server-only operations (database queries, API keys)
- You want to minimize client-side JavaScript

---

## How to Use "use client"

### Basic Syntax

```typescript
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

### Key Rules

1. **Must be at the top** - Before any imports
2. **File-level, not render-level** - Affects the entire module and all transitive dependencies
3. **Not needed everywhere** - Only use where truly necessary

---

## Critical Concept: Props Serialization

Props passed from Server Components to Client Components **must be serializable**.

### ✅ Serializable Types

- Primitive types: `string`, `number`, `boolean`, `null`, `undefined`
- Objects: Plain objects (no custom classes)
- Arrays: Arrays of serializable values
- Date: ISO string format (convert on server: `date.toISOString()`)
- JSX elements: `<div>Hello</div>`
- Promises: For async operations
- Server Functions: Marked with `'use server'`

### ❌ Non-Serializable Types

- **Functions**: Regular functions, arrow functions, class methods
- **Classes**: Class instances with methods
- **Symbols**: `Symbol.for()` or custom symbols
- **DOM elements**: Direct DOM nodes
- **Library objects**: Prisma client, Firebase SDK (have non-serializable properties)

### Example: What Fails

```typescript
// ❌ WRONG - Cannot pass function
'use client'
import { InteractiveComponent } from '@/components/interactive'

export default function ServerComponent() {
  const handleClick = () => console.log('clicked')

  // ERROR: Function not serializable
  return <InteractiveComponent onClick={handleClick} />
}
```

### Example: What Works

```typescript
// ✅ CORRECT - Use Server Action instead
'use server'
async function handleClickAction() {
  console.log('clicked on server')
}

// In Server Component:
import { InteractiveComponent } from '@/components/interactive'

export default function ServerComponent() {
  return <InteractiveComponent action={handleClickAction} />
}

// In Client Component:
'use client'
export function InteractiveComponent({ action }) {
  return <button onClick={() => action()}>Click me</button>
}
```

---

## Composition Patterns

### Pattern 1: Move Client Component Down the Tree

The most important pattern for optimization.

```typescript
// ❌ BAD - Entire layout becomes client
// app/layout.tsx
'use client'
export default function Layout({ children }) {
  const [theme, setTheme] = useState('light')
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}

// ✅ GOOD - Only theme switcher is client
// app/layout.tsx (Server Component)
import { ThemeProvider } from '@/components/theme-provider'
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

// app/components/theme-provider.tsx
'use client'
import { useState } from 'react'
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  return <div className={theme}>{children}</div>
}
```

### Pattern 2: Pass Server Components as Children

You can pass Server Components to Client Components as JSX.

```typescript
// app/interactive-card.tsx
'use client'
export function InteractiveCard({ children, onClick }) {
  return (
    <div onClick={onClick} className="card">
      {children}
    </div>
  )
}

// app/page.tsx (Server Component)
import { InteractiveCard } from '@/components/interactive-card'
import { ExpensiveServerComponent } from '@/components/expensive-server'

export default function Page() {
  return (
    <InteractiveCard onClick={() => console.log('clicked')}>
      {/* This stays on server! */}
      <ExpensiveServerComponent />
    </InteractiveCard>
  )
}
```

### Pattern 3: Context Provider Wrapper

Since React Context doesn't work in Server Components, wrap providers in a Client Component.

```typescript
// app/providers.tsx
'use client'
import { createContext, useState } from 'react'

export const AuthContext = createContext()

export function Providers({ children }) {
  const [user, setUser] = useState(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// app/layout.tsx (Server Component)
import { Providers } from '@/app/providers'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Pattern 4: Third-Party Component Wrapper

Wrap client-only libraries in a Client Component.

```typescript
// app/components/map-provider.tsx
'use client'
import { MapContainer } from 'react-leaflet'

export function MapWrapper({ children, center, zoom }) {
  return (
    <MapContainer center={center} zoom={zoom}>
      {children}
    </MapContainer>
  )
}

// Usage in Server Component
import { MapWrapper } from '@/components/map-provider'
import { MapMarkers } from '@/components/map-markers' // Can be Server Component

export default function MapPage() {
  return <MapWrapper center={[0, 0]} zoom={2}><MapMarkers /></MapWrapper>
}
```

---

## Common Anti-Patterns & How to Fix Them

### ❌ Anti-Pattern 1: "use client" in Layout

```typescript
// WRONG - Makes entire app client-rendered
'use client'
export default function Layout({ children }) {
  const [theme, setTheme] = useState('light')
  return <html><body>{children}</body></html>
}
```

**Fix**: Extract theme logic into separate client component

```typescript
// CORRECT
import { ThemeProvider } from '@/components/providers'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

### ❌ Anti-Pattern 2: Passing Functions from Server to Client

```typescript
// WRONG - Function not serializable
'use server'
async function deleteUser(id) { /* ... */ }

export default function UserComponent() {
  return <UserCard onDelete={deleteUser} /> // ❌ ERROR
}
```

**Fix**: Use Server Actions (named functions with 'use server')

```typescript
// CORRECT
'use server'
async function deleteUser(id) { /* ... */ }

// In Client Component:
'use client'
export function UserCard({ onDelete }) {
  return <button onClick={() => onDelete(123)}>Delete</button>
}

// Pass as 'action' prop
export default function Page() {
  return <UserCard onDelete={deleteUser} />
}
```

### ❌ Anti-Pattern 3: Importing Server Component in Client File

```typescript
// WRONG - Can't import Server Component into Client Component
'use client'
import { ExpensiveQuery } from '@/server-components' // ❌ ERROR

export default function Page() {
  return <ExpensiveQuery />
}
```

**Fix**: Pass Server Component as children or prop

```typescript
// CORRECT - Pass as children
'use client'
export function ClientWrapper({ children }) {
  return <div>{children}</div>
}

// In Server Component
import { ClientWrapper } from '@/components/wrapper'
import { ExpensiveQuery } from '@/server-components'

export default function Page() {
  return (
    <ClientWrapper>
      <ExpensiveQuery />
    </ClientWrapper>
  )
}
```

### ❌ Anti-Pattern 4: Wrapping Provider Around Entire App

```typescript
// WRONG - Forces entire app to client-render
// app/layout.tsx
'use client'
export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <html><body>{children}</body></html>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

**Fix**: Scope providers to only the content they need

```typescript
// CORRECT
// app/layout.tsx
import { Providers } from '@/app/providers'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// app/providers.tsx
'use client'
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
```

---

## Optimization Checklist

When using `'use client'`:

- [ ] Is this really necessary? (Could use Server Component instead?)
- [ ] Can I move `'use client'` deeper in the component tree?
- [ ] Am I passing only serializable props?
- [ ] Could I use Server Actions instead of callbacks?
- [ ] Would composition (children pattern) work better?
- [ ] Are my providers scoped as narrowly as possible?
- [ ] Could large static parts be extracted as Server Components?

---

## Serialization Tips

### Handling Non-Serializable Data

**Problem**: Prisma client has non-serializable properties

```typescript
// ❌ WRONG
import { db } from '@/lib/db'

export default function Page() {
  const user = db.user // Non-serializable!
  return <ClientComponent user={user} /> // ERROR
}
```

**Solution 1**: Query and transform data

```typescript
// ✅ CORRECT
import { db } from '@/lib/db'

export default async function Page() {
  const user = await db.user.findUnique({ where: { id: 1 } })
  // Now it's a plain object, serializable
  return <ClientComponent user={user} />
}
```

**Solution 2**: Transform dates to strings

```typescript
// ✅ CORRECT
import { db } from '@/lib/db'

export default async function Page() {
  const user = await db.user.findUnique({ where: { id: 1 } })
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(), // Convert Date to string
  }
  return <ClientComponent user={serializedUser} />
}
```

---

## Decision Tree: Should I Use "use client"?

```
Does my component need:
├─ State (useState)?                    → YES: Use "use client"
├─ Event handlers?                      → YES: Use "use client"
├─ useEffect or other hooks?            → YES: Use "use client"
├─ Browser APIs (localStorage, etc)?    → YES: Use "use client"
├─ Form submission?                     → Maybe: Consider Server Actions in Server Component
├─ Only displaying data?                → NO: Keep as Server Component
├─ Only fetching data?                  → NO: Keep as Server Component
└─ Rendering markdown/templates?        → NO: Keep as Server Component
```

---

## Key Takeaways

1. **Default to Server Components** - They're the default in App Router for good reason
2. **"use client" at the edges** - Use it only where interactivity begins
3. **Serialize carefully** - Remember: functions, classes, and complex objects can't cross the boundary
4. **Compose strategically** - Use children pattern and prop composition to keep Server Components
5. **Scope narrowly** - Keep providers and client components as focused as possible
6. **Use Server Actions** - For mutations, use Server Actions instead of passing callbacks

---

## References

- [React: 'use client'](https://react.dev/reference/rsc/use-client)
- [Next.js: 'use client' Directive](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [Next.js: Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Next.js: Common Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
