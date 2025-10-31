# Next.js DevTools MCP

[![npm next-devtools-mcp package](https://img.shields.io/npm/v/next-devtools-mcp.svg)](https://npmjs.org/package/next-devtools-mcp)

`next-devtools-mcp` is a Model Context Protocol (MCP) server that provides Next.js development tools and utilities for AI coding assistants like Claude and Cursor.

## Features

This MCP server provides AI coding assistants with comprehensive Next.js development capabilities through three primary mechanisms:

### **1. Runtime Diagnostics & Live State Access** (Next.js 16+)
Connect directly to your running Next.js dev server's built-in MCP endpoint to query:
- Real-time build and runtime errors
- Application routes, pages, and component metadata
- Development server logs and diagnostics
- Server Actions and component hierarchies

### **2. Development Automation**
Tools for common Next.js workflows:
- **Automated Next.js 16 upgrades** with official codemods
- **Cache Components setup** with error detection and automated fixes
- **Browser testing integration** via Playwright for visual verification

### **3. Knowledge Base & Documentation**
- Curated Next.js 16 knowledge base (12 focused resources on Cache Components, async APIs, etc.)
- Direct access to official Next.js documentation via search API
- Pre-configured prompts for upgrade guidance and Cache Components enablement

> **Learn more:** See the [Next.js MCP documentation](https://nextjs.org/docs/app/guides/mcp) for details on how MCP servers work with Next.js and AI coding agents.

## How It Works

This package provides a **bridge MCP server** that connects your AI coding assistant to Next.js development tools:

```
AI Assistant (Claude/Cursor)
      ↓
  MCP Client (in your IDE)
      ↓
  next-devtools-mcp (this package)
      ↓
      ├─→ Next.js Dev Server MCP Endpoint (/_next/mcp) ← Runtime diagnostics
      ├─→ Playwright MCP Server ← Browser automation
      └─→ Knowledge Base & Tools ← Documentation, upgrades, setup automation
```

**Key Architecture Points:**

1. **For Next.js 16+ projects**: This server automatically discovers and connects to your running Next.js dev server's built-in MCP endpoint at `http://localhost:PORT/_next/mcp`. This gives AI assistants direct access to runtime errors, routes, logs, and application state.

2. **For all Next.js projects**: Provides development automation tools (upgrades, Cache Components setup), documentation access, and browser testing capabilities that work independently of the runtime connection.

3. **Auto-discovery**: The `nextjs_runtime` tool scans common ports (3000, 3001, etc.) to find running Next.js servers, so you don't need to manually specify ports in most cases.

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
<summary>Amp</summary>

**Using Amp CLI:**

```bash
amp mcp add next-devtools -- npx next-devtools-mcp@latest
```

**Or configure manually:**

Follow [Amp's MCP documentation](https://ampcode.com/manual#mcp) and apply the standard configuration shown above.

</details>

<details>
<summary>Claude Code</summary>

Use the Claude Code CLI to add the Next.js DevTools MCP server:

```bash
claude mcp add next-devtools npx next-devtools-mcp@latest
```

Alternatively, manually configure Claude by editing your MCP settings file and adding the configuration shown above.

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
<summary>VS Code / Copilot</summary>

**Using VS Code CLI:**

```bash
code --add-mcp '{"name":"next-devtools","command":"npx","args":["-y","next-devtools-mcp@latest"]}'
```

**Or configure manually:**

Follow the official VS Code MCP server setup guide and add the Next.js DevTools server through VS Code settings.

</details>

<details>
<summary>Warp</summary>

**Using Warp UI:**

Navigate to `Settings | AI | Manage MCP Servers` and select `+ Add` to register a new MCP server with the following configuration:
- Name: `next-devtools`
- Command: `npx`
- Arguments: `-y, next-devtools-mcp@latest`

</details>

## Quick Start

### For Next.js 16+ Projects (Recommended)

To unlock the full power of runtime diagnostics, start your Next.js dev server:

```bash
npm run dev
```

Next.js 16+ has MCP enabled by default at `http://localhost:3000/_next/mcp` (or whichever port your dev server uses). The `next-devtools-mcp` server will automatically discover and connect to it.

**Try these prompts in your AI assistant:**

```
What errors are in my Next.js application?
```

```
Show me the structure of my routes
```

```
What's in the development server logs?
```

Your AI assistant will use the `nextjs_runtime` tool to query your running application's actual state.

### For All Next.js Projects

You can use the development automation and documentation tools regardless of Next.js version:

```
Help me upgrade my Next.js app to version 16
```

```
Enable Cache Components in my Next.js app
```

```
Search Next.js docs for generateMetadata
```

## MCP Resources

Next.js 16 knowledge base resources are automatically available to your AI assistant. 

These resources provide comprehensive documentation split into focused sections for efficient context management:

<details>
<summary>📚 Available Knowledge Base Resources (click to expand)</summary>

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

</details>

Resources are loaded on-demand by your AI assistant, providing targeted knowledge without overwhelming the context window.

## MCP Prompts

Pre-configured prompts to help with common Next.js development tasks:

<details>
<summary>💡 Available Prompts (click to expand)</summary>

- **`upgrade-nextjs-16`** - Guide for upgrading to Next.js 16
- **`enable-cache-components`** - Enable caching for React components

</details>

## MCP Tools

<details>
<summary><code>nextjs_docs</code></summary>

Search and retrieve Next.js official documentation and knowledge base.

**Capabilities:**
- Two-step process: 1) Search for docs by keyword to get paths, 2) Fetch full markdown content by path
- Uses official Next.js documentation search API
- Provides access to comprehensive Next.js guides, API references, and best practices
- Supports filtering by router type (App Router, Pages Router, or both)

**Input:**
- `action` (required) - Action to perform: `search` to find docs, `get` to fetch full content
- `query` (optional) - Required for `search`. Keyword search query (e.g., 'metadata', 'generateStaticParams', 'middleware')
- `path` (optional) - Required for `get`. Doc path from search results (e.g., '/docs/app/api-reference/functions/refresh')
- `anchor` (optional) - Optional for `get`. Anchor/section from search results (e.g., 'usage')
- `routerType` (optional) - For `search` only. Filter by: `app`, `pages`, or `all` (default: `all`)

**Output:**
- Search results with doc titles, paths, content snippets, sections, and anchors
- Full markdown content for specific documentation pages

</details>

<details>
<summary><code>browser_eval</code></summary>

Automate and test web applications using Playwright browser automation.

**When to use:**
- Verifying pages in Next.js projects (especially during upgrades or testing)
- Testing user interactions and flows
- Taking screenshots for visual verification
- Detecting runtime errors, hydration issues, and client-side problems
- Capturing browser console errors and warnings

**Important:** For Next.js projects, prioritize using the `nextjs_runtime` tool instead of browser console log forwarding. Only use browser_eval's `console_messages` action as a fallback when `nextjs_runtime` tools are not available.

**Available actions:**
- `start` - Start browser automation (automatically installs if needed)
- `navigate` - Navigate to a URL
- `click` - Click on an element
- `type` - Type text into an element
- `fill_form` - Fill multiple form fields at once
- `evaluate` - Execute JavaScript in browser context
- `screenshot` - Take a screenshot of the page
- `console_messages` - Get browser console messages
- `close` - Close the browser
- `drag` - Perform drag and drop
- `upload_file` - Upload files
- `list_tools` - List all available browser automation tools from the server

**Input:**
- `action` (required) - The action to perform
- `browser` (optional) - Browser to use: `chrome`, `firefox`, `webkit`, `msedge` (default: `chrome`)
- `headless` (optional) - Run browser in headless mode (default: `true`)
- Action-specific parameters (see tool description for details)

**Output:**
- JSON with action result, screenshots (base64), console messages, or error information

</details>

<details>
<summary><code>nextjs_runtime</code></summary>

Connect to your running Next.js dev server's built-in MCP endpoint to access live application state, runtime diagnostics, and internal information.

**What this tool does:**

This tool acts as a bridge between your AI assistant and Next.js 16's built-in MCP endpoint at `/_next/mcp`. It provides three key actions:

1. **`discover_servers`**: Find all running Next.js dev servers on your machine
2. **`list_tools`**: See what runtime diagnostic tools are available from Next.js
3. **`call_tool`**: Execute a specific Next.js runtime tool (e.g., get errors, query routes, fetch logs)

**Available Next.js Runtime Tools** (accessed via `call_tool`):

Once connected to a Next.js 16+ dev server, you can access these built-in tools:
- `get_errors` - Get current build, runtime, and type errors
- `get_logs` - Get path to development log file (browser console + server output)
- `get_page_metadata` - Query application routes, pages, and component metadata
- `get_project_metadata` - Get project structure, config, and dev server URL
- `get_server_action_by_id` - Look up Server Actions by ID to find source files

**Requirements:**
- Next.js 16+ (MCP enabled by default)
- Running dev server (`npm run dev`)

**Typical workflow:**

```javascript
// Step 1: Discover running servers (optional - auto-discovery works in most cases)
{
  "action": "discover_servers"
}

// Step 2: List available runtime tools
{
  "action": "list_tools",
  "port": 3000  // optional if only one server is running
}

// Step 3: Call a specific tool
{
  "action": "call_tool",
  "port": 3000,
  "toolName": "get_errors"
  // args is optional and only needed if the tool requires parameters
}
```

**Input Parameters:**
- `action` (required) - `discover_servers`, `list_tools`, or `call_tool`
- `port` (optional) - Dev server port (auto-discovers if not provided)
- `toolName` (required for `call_tool`) - Name of the Next.js tool to invoke
- `args` (optional) - Arguments object for the tool (only if required by that tool)
- `includeUnverified` (optional) - For `discover_servers`: include servers even if MCP verification fails

**Output:**
- JSON with discovered servers, available tools list, or tool execution results

**Example AI prompts that use this tool:**
- "What errors are in my Next.js app?"
- "Show me my application routes"
- "What's in the dev server logs?"
- "Find the Server Action with ID xyz"

</details>

<details>
<summary><code>upgrade_nextjs_16</code></summary>

Guides through upgrading Next.js to version 16 with automated codemod execution.

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

</details>

<details>
<summary><code>enable_cache_components</code></summary>

Complete Cache Components setup and enablement for Next.js 16 with automated error detection and fixing.

**Capabilities:**
- Pre-flight checks (package manager, Next.js version, configuration)
- Enable Cache Components configuration
- Start dev server with MCP enabled
- Automated route verification and error detection
- Automated error fixing with intelligent boundary setup (Suspense, caching directives, static params)
- Final verification and build testing

**Input:**
- `project_path` (optional) - Path to Next.js project (defaults to current directory)

**Output:**
- Structured JSON with complete setup guidance and phase-by-phase instructions

**Example Usage:**

With Claude Code:
```
Next Devtools, help me enable Cache Components in my Next.js 16 app
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

</details>

## Local Development

To run the MCP server locally for development:

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   pnpm build
   ```
3. Configure your MCP client to use the local version:
   ```json
   {
     "mcpServers": {
       "next-devtools": {
         "command": "node",
         "args": ["/absolute/path/to/next-devtools-mcp/dist/stdio.js"]
       }
     }
   }
   ```

   Note: Replace `/absolute/path/to/next-devtools-mcp` with the actual absolute path to your cloned repository.

   or manually add, e.g. with codex:
   ```
   codex mcp add next-devtools-local -- node dist/stdio.js
   ```

## License

MIT License

