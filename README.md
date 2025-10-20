# Next.js DevTools MCP

[![npm next-devtools-mcp package](https://img.shields.io/npm/v/next-devtools-mcp.svg)](https://npmjs.org/package/next-devtools-mcp)

`next-devtools-mcp` is a Model Context Protocol (MCP) server that provides Next.js development tools and utilities for AI coding assistants like Claude and Cursor.

## Features

- **Next.js Documentation**: Access Next.js documentation and best practices
- **Browser Testing**: Integrate with Playwright for browser automation and testing
- **Chrome DevTools**: Access Chrome DevTools functionality for debugging
- **Development Prompts**: Pre-configured prompts for common Next.js development tasks
- **MCP Tools**: Callable tools for automating Next.js upgrades and Cache Components setup
- **Next.js Runtime Integration**: Direct access to Next.js dev server diagnostics and error detection

## Requirements

- [Node.js](https://nodejs.org/) v20.19 or a newer [latest maintenance LTS](https://github.com/nodejs/Release#release-schedule) version
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

## Getting Started

Add the following config to your MCP client:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

> [!NOTE]
> Using `next-devtools-mcp@latest` ensures that your MCP client will always use the latest version of the Next.js DevTools MCP server.

### MCP Client Configuration

<details>
<summary>Claude Code</summary>

Use the Claude Code CLI to add the Next.js DevTools MCP server:

```bash
claude mcp add next-devtools npx next-devtools-mcp@latest
```

Alternatively, manually configure Claude by editing your MCP settings file and adding the configuration shown above.

</details>

<details>
<summary>Cursor</summary>

**Click the button to install:**

[Install in Cursor](https://cursor.com/en/install-mcp?name=next-devtools&config=eyJjb21tYW5kIjoibnB4IC15IG5leHQtZGV2dG9vbHMtbWNwQGxhdGVzdCJ9)

**Or install manually:**

Go to `Cursor Settings` → `MCP` → `New MCP Server`. Use the config provided above.

</details>

<details>
<summary>Gemini</summary>

**Using Gemini CLI:**

Project-wide installation:
```bash
gemini mcp add next-devtools npx next-devtools-mcp@latest
```

Global installation:
```bash
gemini mcp add -s user next-devtools npx next-devtools-mcp@latest
```

**Or configure manually:**

Follow the MCP setup guide with these parameters:
- Command: `npx`
- Arguments: `-y, next-devtools-mcp@latest`

</details>

<details>
<summary>Codex</summary>

**Using Codex CLI:**

```bash
codex mcp add next-devtools -- npx next-devtools-mcp@latest
```

**Or configure manually:**

Follow the MCP setup guide with the standard configuration format:
- Command: `npx`
- Arguments: `-y, next-devtools-mcp@latest`

**Windows 11 Special Configuration:**

Update `.codex/config.toml` with environment variables and increased startup timeout:

```toml
env = { SystemRoot="C:\\Windows", PROGRAMFILES="C:\\Program Files" }
startup_timeout_ms = 20_000
```

</details>

### Next.js Runtime Integration (Recommended for Next.js >= 16)

**Restart your Next.js dev server:**

```bash
npm run dev
```

**Benefits with Claude Code:**

- **Real-time diagnostics**: Claude Code can query your running Next.js server for errors, routes, and build status
- **Intelligent error detection**: Automatically identify issues in your application
- **Runtime context**: Get accurate information about your app's current state without static analysis
- **Better recommendations**: AI coding agents make informed decisions based on actual runtime behavior

### Your First Prompt

Enter the following prompt in your MCP client to check if everything is working:

```
Help me upgrade my Next.js app to version 16
```

Your MCP client should provide guidance and tools for upgrading your Next.js application.

If you're on **Next.js 16 beta or later** with `experimental.mcpServer` enabled, you can also try:

```
What's the structure of my Next.js routes?
```

Claude Code will query your running dev server for actual route information and component diagnostics.

## Resources

Next.js 16 knowledge base resources are automatically available to your AI assistant. These resources provide comprehensive documentation split into focused sections for efficient context management:

- **`nextjs16://knowledge/overview`** - Overview and critical errors AI agents make
- **`nextjs16://knowledge/core-mechanics`** - Fundamental paradigm shift and how cacheComponents works
- **`nextjs16://knowledge/public-caches`** - Public cache mechanics with 'use cache'
- **`nextjs16://knowledge/private-caches`** - Private cache patterns with 'use cache: private'
- **`nextjs16://knowledge/runtime-prefetching`** - Runtime prefetch configuration and patterns
- **`nextjs16://knowledge/request-apis`** - Async params, searchParams, cookies, headers APIs
- **`nextjs16://knowledge/cache-invalidation`** - updateTag, revalidateTag, and refresh patterns
- **`nextjs16://knowledge/advanced-patterns`** - cacheLife, cacheTag, draft mode, and more
- **`nextjs16://knowledge/build-behavior`** - Prerendering, resume data cache, and metadata
- **`nextjs16://knowledge/error-patterns`** - Common errors and how to fix them
- **`nextjs16://knowledge/test-patterns`** - E2E patterns from 125+ test fixtures
- **`nextjs16://knowledge/reference`** - API reference, checklists, and comprehensive nuances

Resources are loaded on-demand by your AI assistant, providing targeted knowledge without overwhelming the context window.

## Prompts

Pre-configured prompts to help with common Next.js development tasks:

- **`upgrade-nextjs-16`** - Guide for upgrading to Next.js 16
- **`enable-cache-components`** - Enable caching for React components
- **`preload-nextjs-16-knowledge`** - Load the complete Next.js 16 knowledge base into context (use resources for targeted sections instead)

## MCP Tools

Callable tools for automating Next.js development workflows:

### `upgrade_nextjs_16` Tool

Guides through upgrading Next.js to version 16 beta with automated codemod execution.

**Capabilities:**
- Runs official Next.js codemod automatically (requires clean git state)
- Handles async API changes (params, searchParams, cookies, headers)
- Migrates configuration changes
- Updates image defaults and optimization
- Fixes parallel routes and dynamic segments
- Handles deprecated API removals
- Provides guidance for React 19 compatibility

**Input:**
- `project_path` (optional) - Path to Next.js project (defaults to current directory)

**Output:**
- Structured JSON with step-by-step upgrade guidance

### `enable_cache_components` Tool

Complete Cache Components setup and enablement for Next.js 16 with automated error detection and fixing.

**Capabilities:**
- Phase 1: Pre-flight checks (package manager, Next.js version, configuration)
- Phase 2: Enable Cache Components configuration (experimental.cacheComponents flag)
- Phase 3: Start dev server with MCP enabled (__NEXT_EXPERIMENTAL_MCP_SERVER=true)
- Phase 4: Automated route verification and error detection (Playwright + Next.js MCP)
- Phase 5: Automated error fixing with intelligent boundary setup
  - Adds Suspense boundaries for dynamic content
  - Adds `"use cache"` directives for cacheable content
  - Adds `generateStaticParams` for dynamic routes
  - Configures `cacheLife()` profiles based on content change frequency
  - Sets up `cacheTag()` for on-demand revalidation
- Phase 6: Final verification and build testing

**Embedded Knowledge Base:**
- Cache Components mechanics and paradigm shift
- Public and private cache patterns
- Runtime prefetching strategies
- Request APIs (async params, cookies, headers)
- Cache invalidation patterns
- Advanced caching patterns (cacheLife, cacheTag, draft mode)
- Build behavior and static shell generation
- Error patterns and solutions
- 125+ E2E test patterns and examples
- Complete API reference

**Input:**
- `project_path` (optional) - Path to Next.js project (defaults to current directory)

**Output:**
- Structured JSON with complete setup guidance
- Embedded knowledge base resources
- Detailed phase-by-phase instructions

**Example Usage:**

With Claude Code:
```
Help me enable Cache Components in my Next.js 16 app
```

With other agents or programmatically:
```json
{
  "tool": "enable_cache_components",
  "args": {
    "project_path": "/path/to/project"
  }
}
```

## Notable Updates

### Improved `enable-cache-components` Prompt

- Removed redundant port checking step (pkg-mgr dev handles port assignment automatically)
- Removed lock file deletion logic (handled automatically)
- Simplified Phase 3 workflow for better reliability
- Updated step numbering and cross-references throughout

### New MCP Tools for Agent Compatibility

Both `upgrade-nextjs-16` and `enable-cache-components` are now available as MCP tools, enabling:
- Direct invocation by other agents (Codex, Gemini, etc.)
- Programmatic access to structured guidance
- Consistent interface with other MCP tools
- Integration in multi-agent workflows

## Local Development

To run the MCP server locally for development:

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   pnpm build
   ```
4. Configure your MCP client to use the local version:
   ```json
   {
     "mcpServers": {
       "next-devtools": {
         "command": "node",
         "args": ["/path/to/next-devtools-mcp/dist/index.js"]
       }
     }
   }
   ```

   or manually add, e.g. with codex:
   ```
   codex mcp add next-devtools-local -- node dist/index.js
   ```

## License

See LICENSE file for details.

