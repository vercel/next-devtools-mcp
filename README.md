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

## Prompts

Pre-configured prompts to help with common Next.js development tasks:

- **`upgrade-nextjs-16`** - Guide for upgrading to Next.js 16
- **`enable-cache-components`** - Enable caching for React components
- **`preload-nextjs-16-knowledge`** - Load Next.js 16 documentation and best practices

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

