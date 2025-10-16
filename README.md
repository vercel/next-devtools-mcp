# Next.js DevTools MCP

`next-devtools-mcp` is a Model Context Protocol (MCP) server that provides Next.js development tools and utilities for AI coding assistants like Claude and Cursor.

## Features

- **Next.js Documentation**: Access Next.js documentation and best practices
- **Browser Testing**: Integrate with Playwright for browser automation and testing
- **Chrome DevTools**: Access Chrome DevTools functionality for debugging
- **Development Prompts**: Pre-configured prompts for common Next.js development tasks

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

### Your First Prompt

Enter the following prompt in your MCP client to check if everything is working:

```
Help me upgrade my Next.js app to version 16
```

Your MCP client should provide guidance and tools for upgrading your Next.js application.

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

## Development

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

## License

See LICENSE file for details.

