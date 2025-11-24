# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides Next.js development tools for AI coding assistants. The server exposes tools, prompts, and resources to help with Next.js upgrades, Cache Components setup, documentation search, browser testing, and runtime diagnostics.

The server is built using the standard `@modelcontextprotocol/sdk` package with TypeScript and ES modules.

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

### MCP Server Structure

The main server entry point is `src/index.ts` which uses the standard MCP SDK with stdio transport. The server manually registers:
- **Tools** (`src/tools/`): Callable functions for automation - each exports `inputSchema`, `metadata`, and `handler`
- **Prompts** (`src/prompts/`): Pre-configured prompts for common tasks - each exports `inputSchema`, `metadata`, and `handler`
- **Resources** (`src/resources/`): Knowledge base articles and documentation - each exports `metadata` and `handler`

All tools, prompts, and resources are explicitly imported and registered in `src/index.ts`.

### Key Components

**MCP Tools** (`src/tools/`):
- Each tool exports: `inputSchema` (Zod schemas), `metadata` (name, description), `handler` (async function)
- Tools are manually imported and registered in `src/index.ts`
- `nextjs_docs`: Search Next.js documentation and knowledge base
- `browser_eval`: Playwright browser automation (via `playwright-mcp` server)
- `nextjs_index`: Discover all running Next.js dev servers and list their available MCP tools
- `nextjs_call`: Execute specific MCP tools on a running Next.js dev server
- `upgrade_nextjs_16`: Automated Next.js 16 upgrade guidance
- `enable_cache_components`: Complete Cache Components setup with error detection

**MCP Client Library** (`src/_internal/mcp-client.ts`):
- Connects to external MCP servers via stdio transport
- Used by `browser_eval` to communicate with `playwright-mcp`

**Runtime Managers** (`src/_internal/`):
- `browser-eval-manager.ts`: Manages Playwright MCP server lifecycle
- `nextjs-runtime-manager.ts`: Discovers and connects to Next.js dev servers with MCP enabled

**Telemetry System** (`src/telemetry/`):
- `mcp-telemetry-tracker.ts`: Singleton tracker for MCP tool invocations
- `telemetry-events.ts`: Event schema definitions and factory functions
- `telemetry-storage.ts`: Handles anonymous ID, session tracking, and API submission
- `event-queue.ts`: In-memory aggregation of events during session
- `flush-events.ts`: Background process that sends events after server shutdown
- `logger.ts`: Synchronous file logging for debugging
- Telemetry can be disabled via `NEXT_TELEMETRY_DISABLED=1` environment variable
- Data stored in `~/.next-devtools-mcp/` (telemetry-id, telemetry-salt, mcp.log)

**Resources Architecture**:
- Knowledge base split into focused sections (12 sections for Cache Components, 2 for Next.js 16, 1 for fundamentals)
- Each resource exports: `metadata` (uri, name, description, mimeType) and `handler` (function returning content)
- Resources use URI-based addressing (e.g., `cache-components://overview`)
- Markdown files in `src/resources/` and `src/prompts/` are copied during build via `scripts/copy-resources.js` (to `dist/resources/` and `dist/resources/prompts/` respectively)

### TypeScript Configuration

- Target: ES2022, ES modules (NodeNext module resolution)
- Strict mode enabled
- Output directory: `dist/`
- Declaration files generated
- Package marked as `"type": "module"` for native ES module support

## Build Process

1. TypeScript compilation: `tsc` compiles all TypeScript files from `src/` to `dist/`
2. Resource copying: `scripts/copy-resources.js` copies markdown files from `src/resources/` and `src/prompts/` (to `dist/resources/` and `dist/resources/prompts/` respectively)

The `dist/index.js` file is the entry point for the MCP server and includes a shebang for CLI execution.

## MCP Protocol Integration

This server can:
1. Act as a standalone MCP server (stdio transport using `@modelcontextprotocol/sdk`)
2. Connect to other MCP servers as a client (e.g., playwright-mcp, Next.js runtime MCP)

**Key MCP Patterns**:
- Server uses standard MCP SDK `Server` class with `StdioServerTransport`
- Tools use Zod schemas for input validation, converted to JSON Schema for MCP
- Tool handlers are called with validated arguments
- Resources use URI-based addressing (e.g., `cache-components://overview`)
- Prompts return structured messages with markdown content

## External MCP Server Dependencies

**Playwright MCP** (`browser_eval` tool):
- Automatically installed globally via npm when needed
- Package: `@playwright/mcp`
- Command: `npx @playwright/mcp@latest` (with optional `--browser` and `--headless` flags)
- Used for browser automation and testing

**Next.js Runtime MCP** (`nextjs_index` and `nextjs_call` tools):
- Built into Next.js 16+ (enabled by default)
- Endpoint: `http://localhost:<port>/_next/mcp`
- Provides runtime diagnostics, errors, routes, and build status
- Server discovery via common ports (3000, 3001, etc.)

## Common Development Patterns

**Adding a new MCP tool**:
1. Create tool file in `src/tools/` with:
   - `export const inputSchema = { ... }` - Zod schemas for each parameter
   - `export const metadata = { name, description }`
   - `export async function handler(args) { ... }` - Tool implementation
2. Import and add to the `tools` array in `src/index.ts`
3. Build and test

**Adding a new MCP resource**:
1. Create markdown file(s) in `src/resources/`
2. Create resource handler TypeScript file in `src/resources/` with:
   - `export const metadata = { uri, name, description, mimeType }`
   - `export function handler() { return readResourceFile(...) }` - Returns content
3. Import and add to the `resources` array in `src/index.ts`
4. The `scripts/copy-resources.js` script automatically copies `.md` files to `dist/resources/`

**Adding a new MCP prompt**:
1. Create prompt file in `src/prompts/` with:
   - `export const inputSchema = { ... }` - Optional Zod schemas for parameters
   - `export const metadata = { name, description, role }`
   - `export function handler(args) { ... }` - Returns prompt text
2. Import and add to the `prompts` array in `src/index.ts`
3. Build and test

**Working with external MCP servers**:
- Use `src/_internal/mcp-client.ts` for stdio-based communication
- Create manager module in `src/_internal/` for lifecycle management
- Handle server installation, connection, and cleanup

## Package Publishing

- Package name: `next-devtools-mcp`
- Package type: ES module (`"type": "module"`)
- Binary: `next-devtools-mcp` points to `dist/index.js`
- prepublishOnly hook: cleans and rebuilds before publishing
- Use `pnpm@9.15.9` as package manager
