# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides Next.js development tools for AI coding assistants. The server exposes tools, prompts, and resources to help with Next.js upgrades, Cache Components setup, documentation search, browser testing, and runtime diagnostics.

## Build and Development Commands

```bash
# Install dependencies
pnpm install

# Build the project (required before running tests or publishing)
pnpm build

# Watch mode for development
pnpm dev

# Run tests (IMPORTANT: must run pnpm build first)
pnpm build && pnpm test

# Type check
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Testing

The test suite uses vitest with Claude Agent SDK for E2E testing:

```bash
# Run all tests
pnpm build && pnpm test

# Note: Tests require ANTHROPIC_API_KEY environment variable
# Get your key from: https://console.anthropic.com/
```

Test files are located in `test/e2e/` and use test fixtures from `test/fixtures/`.

## Architecture

### MCP Server Structure (src/index.ts)

The main server (`src/index.ts`) uses stdio transport and registers:
- **Tools** (`src/mcp-tools/`): Callable functions for automation
- **Prompts** (`src/mcp-prompts/`): Pre-configured prompts for common tasks
- **Resources** (`src/mcp-resources/`): Knowledge base articles and documentation

### Key Components

**MCP Tools Registry** (`src/mcp-tools/index.ts`):
- `nextjs_docs`: Search Next.js documentation and knowledge base
- `browser_eval`: Playwright browser automation (via `playwright-mcp` server)
- `nextjs_runtime`: Connect to Next.js dev server MCP endpoint for runtime diagnostics
- `upgrade_nextjs_16`: Automated Next.js 16 upgrade guidance
- `enable_cache_components`: Complete Cache Components setup with error detection

**MCP Client Library** (`src/lib/mcp-client.ts`):
- Connects to external MCP servers via stdio transport
- Used by `browser_eval` to communicate with `playwright-mcp`
- Used by `nextjs_runtime` to communicate with Next.js dev server MCP endpoint

**Runtime Managers** (`src/lib/`):
- `browser-eval-manager.ts`: Manages Playwright MCP server lifecycle
- `nextjs-runtime-manager.ts`: Discovers and connects to Next.js dev servers with MCP enabled

**Resources Architecture**:
- Knowledge base split into focused sections (12 sections for Next.js 16)
- Resources are loaded on-demand to avoid overwhelming context
- Markdown files in `src/mcp-resources/` are copied to `dist/` during build via `scripts/copy-resources.js`

### TypeScript Configuration

- Target: ES2022, CommonJS modules
- Strict mode enabled
- Output directory: `dist/`
- Declaration files generated

## Build Process

1. TypeScript compilation: `tsc` compiles `src/` to `dist/`
2. Resource copying: `scripts/copy-resources.js` copies markdown files and knowledge base directories from `src/` to `dist/`

The `dist/index.js` file is the entry point for the MCP server and includes a shebang for CLI execution.

## MCP Protocol Integration

This server can:
1. Act as a standalone MCP server (stdio transport)
2. Connect to other MCP servers as a client (e.g., playwright-mcp, Next.js runtime MCP)

**Key MCP Patterns**:
- Tools use Zod schemas for input validation
- Tool handlers receive validated arguments via `tool.execute()`
- Resources use URI-based addressing (e.g., `nextjs16://knowledge/overview`)
- Prompts return structured messages with markdown content

## External MCP Server Dependencies

**Playwright MCP** (`browser_eval` tool):
- Automatically installed via npx when needed
- Command: `npx -y @modelcontextprotocol/server-playwright`
- Used for browser automation and testing

**Next.js Runtime MCP** (`nextjs_runtime` tool):
- Built into Next.js 16+ (enabled by default)
- Endpoint: `http://localhost:<port>/_next/mcp`
- Provides runtime diagnostics, errors, routes, and build status
- Server discovery via common ports (3000, 3001, etc.)

## Common Development Patterns

**Adding a new MCP tool**:
1. Create tool file in `src/mcp-tools/` with Zod schema and `tool()` function
2. Export from `src/mcp-tools/index.ts` and add to `MCP_TOOLS` registry
3. Build and test

**Adding a new MCP resource**:
1. Create markdown file(s) in `src/mcp-resources/`
2. Update `scripts/copy-resources.js` to include new resource
3. Create resource handler in `src/mcp-resources/` with URI scheme
4. Register in `src/index.ts` ListResourcesRequestSchema and ReadResourceRequestSchema handlers

**Working with external MCP servers**:
- Use `src/lib/mcp-client.ts` for stdio-based communication
- Create manager module in `src/lib/` for lifecycle management
- Handle server installation, connection, and cleanup

## Package Publishing

- Package name: `next-devtools-mcp`
- Binary: `next-devtools-mcp` points to `dist/index.js`
- prepublishOnly hook: cleans and rebuilds before publishing
- Use `pnpm@9.15.9` as package manager
