import { describe, expect, it } from "vitest"
import { createServer } from "node:http"
import { handler } from "../../src/tools/nextjs_index.js"

async function closedPort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Missing listening port")
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return address.port
}

describe("nextjs_index with an explicit port", () => {
  it("says it cannot connect when nothing is listening on the port", async () => {
    const port = await closedPort()
    const result = JSON.parse(await handler({ port }))
    expect(result.success).toBe(false)
    expect(result.error).toContain(`Cannot connect to Next.js dev server on port ${port}`)
    expect(result.error).not.toContain("No MCP tools found")
  })
})
