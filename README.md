# Next.js DevTools MCP

[![npm next-devtools-mcp package](https://img.shields.io/npm/v/next-devtools-mcp.svg)](https://npmjs.org/package/next-devtools-mcp)

`next-devtools-mcp` is a Model Context Protocol (MCP) server that connects coding agents like Claude and Cursor to your running Next.js dev server. It discovers running servers and proxies their built-in MCP endpoint (`/_next/mcp`), giving agents live access to runtime errors, routes, and logs — plus Playwright-based browser testing.

> [!NOTE]
> Documentation and migration guidance no longer ship in this server. Next.js bundles its docs in `node_modules/next/dist/docs/` (surfaced via `AGENTS.md`), and upgrade/Cache Components workflows are now distributed as agent skills. See [Migrating from 0.3.x](#migrating-from-03x).


## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) v20.19 or a newer [latest maintenance LTS](https://github.com/nodejs/Release#release-schedule) version
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)


### Install with add-mcp

Install the MCP server for all your coding agents:

```bash
npx add-mcp next-devtools-mcp@latest
```

Add `-y` to skip the confirmation prompt and install to all detected agents already in use in the project directory. Add `-g` to install globally across all projects.


### Manual installation

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

Start your Next.js dev server:

```bash
npm run dev
```

Next.js 16+ has its MCP endpoint enabled by default at `http://localhost:3000/_next/mcp` (or whichever port your dev server uses). `next-devtools-mcp` automatically discovers and connects to it — no configuration needed.

Then ask your coding agent about your running application:

```
Next Devtools, what errors are in my Next.js application?
```

```
Next Devtools, show me the structure of my routes
```

```
Next Devtools, what's in the development server logs?
```

Your agent uses the `nextjs_index` and `nextjs_call` tools to query your running application's actual state.

> **Looking for docs, upgrades, or Cache Components setup?** Those no longer live here — see [Migrating from 0.3.x](#migrating-from-03x).

## MCP Tools

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

## Migrating from 0.3.x

Starting in 0.4.0, `next-devtools-mcp` is a thin connector to the Next.js dev server. These were removed:

- **`nextjs_docs` tool and `nextjs-docs://llms-index` resource** — Next.js bundles its full documentation in `node_modules/next/dist/docs/` (as markdown), surfaced to agents through the project's `AGENTS.md`. Point your agent at those files instead of fetching docs over MCP.
- **`init` tool** — it existed only to enforce the docs-fetch workflow above, which is no longer needed.
- **`upgrade_nextjs_16` and `enable_cache_components` tools, and their prompts** — these workflows are moving to distributable agent skills.
- **All `cache-components://`, `nextjs16://`, and `nextjs-fundamentals://` resources** — superseded by the bundled docs.

What remains is server discovery (`nextjs_index`), runtime proxying (`nextjs_call`), and browser automation (`browser_eval`).

## Privacy & Telemetry

### What Data is Collected

`next-devtools-mcp` collects anonymous usage telemetry to help improve the tool. The following data is collected:

- **Tool usage**: Which MCP tools are invoked (e.g., `nextjs_index`, `nextjs_call`, `browser_eval`)
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

If you encounter an `ERR_MODULE_NOT_FOUND` error referencing `next-devtools-mcp/dist`:

**Solution:** Clear your npx cache and restart your MCP client (Cursor, Claude Code, etc.). The server will be freshly installed.

### "No server info found" Error

If you see `[error] No server info found`:

**Solutions:**
1. Make sure your Next.js dev server is running: `npm run dev`
2. Confirm you are on Next.js 16+ (the `/_next/mcp` endpoint is only available there)
3. Verify your dev server started successfully without errors

**Note:** The `nextjs_index` and `nextjs_call` tools require Next.js 16+ with a running dev server. `browser_eval` works without one.

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

This MCP server gives coding agents two capabilities:

### **1. Runtime Diagnostics & Live State Access** (Next.js 16+)
Connect directly to your running Next.js dev server's built-in MCP endpoint to query:
- Real-time build and runtime errors
- Application routes, pages, and component metadata
- Development server logs and diagnostics
- Server Actions and component hierarchies

### **2. Browser Testing**
Playwright-based browser automation for visual verification, interaction testing, and capturing client-side errors.

> **Learn more:** See the [Next.js MCP documentation](https://nextjs.org/docs/app/guides/mcp) for details on how MCP servers work with Next.js and coding agents.

## How It Works

This package is a **thin connector** between your coding agent and your Next.js dev server:

```
Coding Agent
      ↓
  next-devtools-mcp (this package)
      ↓
      ├─→ Next.js Dev Server MCP Endpoint (/_next/mcp) ← Runtime diagnostics
      └─→ Playwright MCP Server ← Browser automation
```

It discovers running Next.js 16+ dev servers and proxies their built-in MCP endpoint at `http://localhost:PORT/_next/mcp`, giving agents direct access to runtime errors, routes, logs, and application state. The workflow: call `nextjs_index` to discover servers and their available tools, then `nextjs_call` with the port and tool name to execute one.


## License

MIT License
