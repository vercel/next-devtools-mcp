# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that acts as a thin connector between AI coding assistants and a running Next.js dev server. It discovers running Next.js 16+ dev servers and proxies their built-in MCP endpoint (`/_next/mcp`) for runtime diagnostics, and provides Playwright-based browser automation.

It exposes **tools only** — no prompts or resources. Documentation ships with Next.js itself (`node_modules/next/dist/docs/`), and upgrade/Cache Components workflows are distributed as agent skills, so they are intentionally not part of this server. See the "Migrating from 0.3.x" section of `README.md` for the removal history.

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

The test suite uses vitest:

```bash
# Run unit tests (default; excludes test/e2e/)
pnpm build && pnpm test

# Run e2e tests (spawns the built server over stdio)
pnpm build && pnpm test:e2e
```

Unit tests live in `test/unit/`; e2e tests in `test/e2e/` spawn `dist/index.js` and exercise it over the MCP protocol. Fixtures are in `test/fixtures/`.

## Architecture

### MCP Server Structure

The main server entry point is `src/index.ts` which uses the standard MCP SDK with stdio transport. The server declares only the `tools` capability and registers tools from `src/tools/`, each exporting `inputSchema`, `metadata`, and `handler`. There are no prompt or resource handlers.

### Key Components

**MCP Tools** (`src/tools/`):
- Each tool exports: `inputSchema` (Zod schemas), `metadata` (name, description), `handler` (async function)
- Tools are manually imported and registered in `src/index.ts`
- `nextjs_docs`: Version-aware docs gateway — points agents at the bundled docs in `node_modules/next/dist/docs/` (Next.js 16+) or recommends the upgrade codemod. Does NOT fetch docs.
- `nextjs_index`: Discover all running Next.js dev servers and list their available MCP tools
- `nextjs_call`: Execute specific MCP tools on a running Next.js dev server
- `browser_eval`: Playwright browser automation (via `playwright-mcp` server)

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

### TypeScript Configuration

- Target: ES2022, ES modules (NodeNext module resolution)
- Strict mode enabled
- Output directory: `dist/`
- Declaration files generated
- Package marked as `"type": "module"` for native ES module support

## Build Process

`pnpm build` runs `tsc`, compiling all TypeScript files from `src/` to `dist/`. The `dist/index.js` file is the entry point for the MCP server and includes a shebang for CLI execution.

## MCP Protocol Integration

This server can:
1. Act as a standalone MCP server (stdio transport using `@modelcontextprotocol/sdk`)
2. Connect to other MCP servers as a client (e.g., playwright-mcp, Next.js runtime MCP)

**Key MCP Patterns**:
- Server uses standard MCP SDK `Server` class with `StdioServerTransport`
- Tools use Zod schemas for input validation, converted to JSON Schema for MCP
- Tool handlers are called with validated arguments

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

> This server intentionally ships tools only. Do not re-add prompt or resource handlers — documentation lives in Next.js's bundled docs (`node_modules/next/dist/docs/`) and workflows are distributed as agent skills.

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
