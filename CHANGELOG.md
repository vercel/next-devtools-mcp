# next-devtools-mcp

## 0.4.1

### Patch Changes

- [#151](https://github.com/vercel/next-devtools-mcp/pull/151) [`9c0744d`](https://github.com/vercel/next-devtools-mcp/commit/9c0744da2ad2c1819eabaeb88dde9ebdcd67ad31) Thanks [@gaojude](https://github.com/gaojude)! - Generate MCP input schemas with the SDK converter so object arguments, required fields, and accepted port types match runtime validation.

- [#156](https://github.com/vercel/next-devtools-mcp/pull/156) [`ec7987b`](https://github.com/vercel/next-devtools-mcp/commit/ec7987b9e1cd3b36ee9dc12b9518e49667f7959d) Thanks [@gaojude](https://github.com/gaojude)! - Propagate MCP cancellation to upstream requests, bound response reads with a deadline, and release unused probe response bodies.

- [#152](https://github.com/vercel/next-devtools-mcp/pull/152) [`57ba793`](https://github.com/vercel/next-devtools-mcp/commit/57ba7930aecbea171a3032fe60bc87ea698c8070) Thanks [@gaojude](https://github.com/gaojude)! - Provide online documentation guidance when the installed Next.js package has no bundled docs, and distinguish this from missing dependencies.

- [#153](https://github.com/vercel/next-devtools-mcp/pull/153) [`6bd996f`](https://github.com/vercel/next-devtools-mcp/commit/6bd996f785df2eb5634984aedb6397f5306844b5) Thanks [@gaojude](https://github.com/gaojude)! - Preserve downstream MCP tool error status in nextjs_call responses and mark connection failures as tool errors.

- [#155](https://github.com/vercel/next-devtools-mcp/pull/155) [`eaa7cc8`](https://github.com/vercel/next-devtools-mcp/commit/eaa7cc8a34af31a304bc44b589427ad3e2454a05) Thanks [@gaojude](https://github.com/gaojude)! - Resolve the installed Next.js package from the project so hoisted dependencies report the correct version and absolute documentation path.

- [#154](https://github.com/vercel/next-devtools-mcp/pull/154) [`7a14fa6`](https://github.com/vercel/next-devtools-mcp/commit/7a14fa65a2992c7a1c4c1da62cb00045d925ef6c) Thanks [@gaojude](https://github.com/gaojude)! - Exclude server candidates whose MCP tool listing fails, including ordinary HTTP catch-all applications.
