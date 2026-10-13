---
"next-devtools-mcp": patch
---

Report why `nextjs_index` could not reach an explicit port (for example "Cannot connect to Next.js dev server") instead of "No MCP tools found ... may not be running Next.js 16+", and use `NEXT_DEVTOOLS_HOST` in the URLs of auto-discovered servers.
