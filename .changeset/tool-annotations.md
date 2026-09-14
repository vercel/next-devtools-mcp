---
"next-devtools-mcp": patch
---

Declare MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) on every tool, so clients can tell the three read-only tools from `nextjs_call`, which proxies whatever tool the dev server exposes.
