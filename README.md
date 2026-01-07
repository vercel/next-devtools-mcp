# Next.js DevTools MCP

[![npm next-devtools-mcp package](https://img.shields.io/npm/v/next-devtools-mcp.svg)](https://npmjs.org/package/next-devtools-mcp)

`next-devtools-mcp` is a Model Context Protocol (MCP) server that provides Next.js development tools and utilities for coding agents like Claude and Cursor.


## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) v20.19 or a newer [latest maintenance LTS](https://github.com/nodejs/Release#release-schedule) version
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)


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
<summary>Google Antigravity</summary>

**Configure in MCP config file:**

Add this to your Antigravity MCP config file: `.gemini/antigravity/mcp_config.json`

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

See [Antigravity MCP docs](https://antigravity.google/docs/mcp) for more info.

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

**⚠️ IMPORTANT: Start every Next.js session by calling the `init` tool to set up proper context:**

```
Use the init tool to set up Next.js DevTools context
```

This initializes the MCP context and ensures the AI assistant uses official Next.js documentation for all queries.

**After initialization, try these prompts to explore runtime diagnostics:**

```
Next Devtools, what errors are in my Next.js application?
```

```
Next Devtools, show me the structure of my routes
```

```
Next Devtools, what's in the development server logs?
```

Your coding agent will use the `nextjs_index` and `nextjs_call` tools to query your running application's actual state.

### For All Next.js Projects

You can use the development automation and documentation tools regardless of Next.js version:

```
Next Devtools, help me upgrade my Next.js app to version 16
```

```
Next Devtools, enable Cache Components in my Next.js app
```

```
Next Devtools, search Next.js docs for generateMetadata
```

### 💡 Pro Tip: Auto-Initialize on Every Session

To make your AI assistant **automatically call the `init` tool** at the start of every Next.js session without being asked, add this instruction to your agent's configuration file:

<details>
<summary>Claude Code / Claude Desktop</summary>

Add to `~/.claude/CLAUDE.md` (global) or `./.claude/CLAUDE.md` (project-specific):

```markdown
**When starting work on a Next.js project, ALWAYS call the `init` tool from
next-devtools-mcp FIRST to set up proper context and establish documentation
requirements. Do this automatically without being asked.**
```

</details>

<details>
<summary>Cursor</summary>

Add to `.cursorrules` in your project root or global Cursor settings:

```
When working with Next.js, always call the init tool from next-devtools-mcp
at the start of the session to establish proper context and documentation requirements.
```

</details>

<details>
<summary>Codex / Other AI Coding Assistants</summary>

Add to your agent's configuration file (e.g., `.codex/instructions.md`, `agent.md`, or similar):

```markdown
**Next.js Initialization**: When starting work on a Next.js project, automatically
call the `init` tool from the next-devtools-mcp server FIRST. This establishes
proper context and ensures all Next.js queries use official documentation.
```

</details>

**Why this matters:**
- ✅ Ensures consistent context across all Next.js work
- ✅ Automatically establishes the documentation-first requirement
- ✅ No need to manually call init every time
- ✅ Works across all your Next.js projects

## MCP Resources

The knowledge base resources are automatically available to your coding agent and are split into focused sections for efficient context management. Current resource URIs:

<details>
<summary>📚 Available Knowledge Base Resources (click to expand)</summary>

- Cache Components (12 sections):
  - `cache-components://overview`
  - `cache-components://core-mechanics`
  - `cache-components://public-caches`
  - `cache-components://private-caches`
  - `cache-components://runtime-prefetching`
  - `cache-components://request-apis`
  - `cache-components://cache-invalidation`
  - `cache-components://advanced-patterns`
  - `cache-components://build-behavior`
  - `cache-components://error-patterns`
  - `cache-components://test-patterns`
  - `cache-components://reference`

- Next.js 16 migration:
  - `nextjs16://migration/beta-to-stable`
  - `nextjs16://migration/examples`

- Next.js fundamentals:
  - `nextjs-fundamentals://use-client`

</details>

Resources are loaded on-demand by your coding agent, providing targeted knowledge without overwhelming the context window.

## MCP Prompts

Pre-configured prompts to help with common Next.js development tasks:

<details>
<summary>💡 Available Prompts (click to expand)</summary>

- **`upgrade-nextjs-16`** - Guide for upgrading to Next.js 16
- **`enable-cache-components`** - Migrate and enable Cache Components mode for Next.js 16

</details>

## MCP Tools

<details>
<summary><code>init</code></summary>

Initialize Next.js DevTools MCP context and establish documentation requirements.

**Capabilities:**
- Sets up proper context for AI assistants working with Next.js
- Establishes requirement to use `nextjs_docs` for ALL Next.js-related queries
- Documents all available MCP tools and their use cases
- Provides best practices for Next.js development with MCP
- Includes example workflows and quick start checklist

**When to use:**
- At the beginning of a Next.js development session
- To understand available tools and establish proper context
- To ensure documentation-first approach for Next.js development

**Input:**
- `project_path` (optional) - Path to Next.js project (defaults to current directory)

**Output:**
- Comprehensive initialization context and guidance for Next.js development with MCP tools

</details>

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

**Important:** For Next.js projects, prioritize using the `nextjs_index` and `nextjs_call` tools instead of browser console log forwarding. Only use browser_eval's `console_messages` action as a fallback when these tools are not available.

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
<summary><code>nextjs_index</code></summary>

Discover all running Next.js dev servers and list their available MCP tools.

**What this tool does:**

Automatically discovers all running Next.js 16+ dev servers on your machine and lists the runtime diagnostic tools available from each server's built-in MCP endpoint at `/_next/mcp`.

**No parameters required** - Just call the tool and it will scan for servers.

**Available Next.js Runtime Tools** (varies by Next.js version):
- `get_errors` - Get current build, runtime, and type errors
- `get_logs` - Get path to development log file (browser console + server output)
- `get_page_metadata` - Query application routes, pages, and component metadata
- `get_project_metadata` - Get project structure, config, and dev server URL
- `get_server_action_by_id` - Look up Server Actions by ID to find source files

**Requirements:**
- Next.js 16+ (MCP enabled by default)
- Running dev server (`npm run dev`)

**Output:**
- JSON with list of discovered servers, each containing:
  - Port, PID, URL
  - Available tools with descriptions and input schemas

**Example prompts:**
- "Next Devtools, what servers are running?"
- "Next Devtools, show me available diagnostic tools"

</details>

<details>
<summary><code>nextjs_call</code></summary>

Execute a specific MCP tool on a running Next.js dev server.

**What this tool does:**

Calls a specific runtime diagnostic tool on a Next.js 16+ dev server's built-in MCP endpoint at `/_next/mcp`.

**Input Parameters:**
- `port` (required) - Dev server port (use `nextjs_index` first to discover)
- `toolName` (required) - Name of the Next.js tool to invoke
- `args` (optional) - Arguments object for the tool (only if required by that tool)

**Requirements:**
- Next.js 16+ (MCP enabled by default)
- Running dev server (`npm run dev`)
- Use `nextjs_index` first to discover available servers and tools

**Typical workflow:**

```javascript
// Step 1: Discover servers and tools
// (call nextjs_index first)

// Step 2: Call a specific tool
{
  "port": 3000,
  "toolName": "get_errors"
  // args is optional and only needed if the tool requires parameters
}
```

**Output:**
- JSON with tool execution results

**Example prompts that use this tool:**
- "Next Devtools, what errors are in my Next.js app?"
- "Next Devtools, show me my application routes"
- "Next Devtools, what's in the dev server logs?"
- "Next Devtools, find the Server Action with ID xyz"

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

Complete Cache Components setup, enablement, and migration for Next.js 16 with automated error detection and fixing. This tool is used for migrating Next.js applications to Cache Components mode.

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

## Privacy & Telemetry

### What Data is Collected

`next-devtools-mcp` collects anonymous usage telemetry to help improve the tool. The following data is collected:

- **Tool usage**: Which MCP tools are invoked (e.g., `nextjs_index`, `nextjs_call`, `browser_eval`, `upgrade_nextjs_16`)
- **Error events**: Anonymous error messages when tools fail
- **Session metadata**: Session ID, timestamps, and basic environment info (OS, Node.js version)

**What is NOT collected:**
- Your project code, file contents, or file paths
- Personal information or identifiable data
- API keys, credentials, or sensitive configuration
- Arguments passed to tools (except tool names)

Local files are written under `~/.next-devtools-mcp/` (anonymous `telemetry-id`, `telemetry-salt`, and a debug log `mcp.log`). Events are sent to the telemetry endpoint in the background to help us understand usage patterns and improve reliability.

### Opt-Out

To disable telemetry completely, set the environment variable:

```bash
export NEXT_TELEMETRY_DISABLED=1
```

Add this to your shell configuration file (e.g., `~/.bashrc`, `~/.zshrc`) to make it permanent.

You can also delete your local telemetry data at any time:

```bash
rm -rf ~/.next-devtools-mcp
```

## Troubleshooting

### Module Not Found Error

If you encounter an error like:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\next-devtools-mcp\dist\resources\(cache-components)\...'
```

**Solution:** Clear your npx cache and restart your MCP client (Cursor, Claude Code, etc.). The server will be freshly installed.

### "No server info found" Error

If you see `[error] No server info found`:

**Solutions:**
1. Make sure your Next.js dev server is running: `npm run dev`
2. If using Next.js 15 or earlier, use the `upgrade_nextjs_16` tool to upgrade to Next.js 16+
3. Verify your dev server started successfully without errors

**Note:** The `nextjs_index` and `nextjs_call` tools require Next.js 16+ with a running dev server. Other tools (`nextjs_docs`, `browser_eval`, `upgrade_nextjs_16`, `enable_cache_components`) work without a running server.

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
         "args": ["/absolute/path/to/next-devtools-mcp/dist/index.js"]
       }
     }
   }
   ```

   Note: Replace `/absolute/path/to/next-devtools-mcp` with the actual absolute path to your cloned repository.

   or manually add, e.g. with codex:
   ```
   codex mcp add next-devtools-local -- node dist/index.js
   ```

## Features

This MCP server provides coding agents with comprehensive Next.js development capabilities through three primary mechanisms:

### **1. Runtime Diagnostics & Live State Access** (Next.js 16+)
Connect directly to your running Next.js dev server's built-in MCP endpoint to query:
- Real-time build and runtime errors
- Application routes, pages, and component metadata
- Development server logs and diagnostics
- Server Actions and component hierarchies

### **2. Development Automation**
Tools for common Next.js workflows:
- **Automated Next.js 16 upgrades** with official codemods
- **Cache Components migration and setup** with error detection and automated fixes
- **Browser testing integration** via Playwright for visual verification

### **3. Knowledge Base & Documentation**
- Curated Next.js 16 knowledge base (12 focused resources on Cache Components, async APIs, etc.)
- Direct access to official Next.js documentation via search API
- Pre-configured prompts for upgrade guidance and Cache Components enablement

> **Learn more:** See the [Next.js MCP documentation](https://nextjs.org/docs/app/guides/mcp) for details on how MCP servers work with Next.js and coding agents.

## How It Works

This package provides a **bridge MCP server** that connects your coding agent to Next.js development tools:

```
Coding Agent
      ↓
  next-devtools-mcp (this package)
      ↓
      ├─→ Next.js Dev Server MCP Endpoint (/_next/mcp) ← Runtime diagnostics
      ├─→ Playwright MCP Server ← Browser automation
      └─→ Knowledge Base & Tools ← Documentation, upgrades, setup automation
```

**Key Architecture Points:**

1. **For Next.js 16+ projects**: This server automatically discovers and connects to your running Next.js dev server's built-in MCP endpoint at `http://localhost:PORT/_next/mcp`. This gives coding agents direct access to runtime errors, routes, logs, and application state.

2. **For all Next.js projects**: Provides development automation tools (upgrades, Cache Components setup), documentation access, and browser testing capabilities that work independently of the runtime connection.

3. **Simple workflow**: Call `nextjs_index` to see all servers and available tools, then call `nextjs_call` with the specific port and tool name you want to execute.


## License

MIT License
