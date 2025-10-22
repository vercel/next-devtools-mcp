[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/vercel-next-devtools-mcp-badge.png)](https://mseep.ai/app/vercel-next-devtools-mcp)

# Next.js DevTools MCP

[![npm next-devtools-mcp package](https://img.shields.io/npm/v/next-devtools-mcp.svg)](https://npmjs.org/package/next-devtools-mcp)

`next-devtools-mcp` is a Model Context Protocol (MCP) server that provides Next.js development tools and utilities for AI coding assistants like Claude and Cursor.

## Features

- **MCP Tools**: Callable tools for automating Next.js upgrades and Cache Components setup
- **Development Prompts**: Pre-configured prompts for common Next.js development tasks
- **Next.js Documentation**: Access Next.js documentation and best practices
- **Browser Testing**: Integrate with Playwright for browser automation and testing
- **Next.js Agent**: Access internal state, diagnostics, and errors from running Next.js dev servers via MCP

> **Learn more:** See the [Next.js MCP documentation](https://nextjs.org/docs/app/guides/mcp) for details on how MCP servers work with Next.js and AI coding agents.

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

### Next.js Internal State Access (Recommended for Next.js >= 16)

**Restart your Next.js dev server:**

```bash
npm run dev
```

**Benefits:**

- **MCP Server Discovery**: Automatically discover and connect to Next.js dev servers running with MCP enabled
- **Internal State Access**: Query your running Next.js instance for errors, routes, build status, and diagnostics
- **Real-time Error Detection**: Access internal Next.js error state and compiler diagnostics through MCP
- **Direct Communication**: AI coding agents communicate directly with Next.js through MCP protocol for accurate, real-time information

### Your First Prompt

Enter the following prompt in your MCP client to check if everything is working:

```
Next Devtools, help me upgrade my Next.js app to version 16
```

Your MCP client should provide guidance and tools for upgrading your Next.js application.

If you're on **Next.js 16 or later** with `experimental.mcpServer` enabled, you can also try:

```
Next Devtools, what's the structure of my Next.js routes?
```

Claude Code will query your running dev server for actual route information and component diagnostics.

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
- First searches MCP resources (Next.js 16 knowledge base) for latest information
- Falls back to official Next.js documentation if nothing is found
- Provides access to comprehensive Next.js guides, API references, and best practices
- Smart keyword matching for topics like cache, prefetch, params, cookies, headers, etc.

**Input:**
- `query` (required) - Search query to find relevant Next.js documentation sections
- `category` (optional) - Filter by category: `all`, `getting-started`, `guides`, `api-reference`, `architecture`, `community`

**Output:**
- Relevant documentation sections from Next.js 16 knowledge base (with content preview)
- Links to official Next.js documentation pages

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

Discover running MCP servers from Next.js instances and invoke their MCP devtools.

**Requirements:**
- Next.js 16 or later (MCP support added in v16)
- MCP is enabled by default in Next.js 16+

**Input:**
- `action` (required) - Action to perform: `discover_servers`, `list_tools`, `call_tool`
- `port` (optional) - Port number of Next.js dev server (auto-discovers if not provided)
- `toolName` (optional) - Name of the Next.js MCP tool to call (required for `call_tool`)
- `args` (optional) - Arguments object to pass to the tool
- `includeUnverified` (optional) - Include servers even if MCP verification fails

**Output:**
- JSON with discovered servers, available tools, or tool execution results

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

MIT License

