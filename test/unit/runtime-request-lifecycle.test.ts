import { describe, expect, it } from "vitest"
import { createServer, type ServerResponse } from "node:http"
import { callNextJsTool, probePort } from "../../src/_internal/nextjs-runtime-manager.js"

async function runtime(mode: "headers" | "body" | "probe" | "success") {
  const open = new Set<ServerResponse>()
  let reached!: () => void
  const requested = new Promise<void>((resolve) => {
    reached = resolve
  })
  const server = createServer(async (req, res) => {
    let body = ""
    for await (const chunk of req) body += chunk
    const request = JSON.parse(body)
    if (mode !== "probe" && request.method === "tools/list") {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { tools: [] } })}\n\n`
      )
      return
    }
    if (mode === "success") {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { content: [] } })}\n\n`
      )
      return
    }
    open.add(res)
    res.once("close", () => open.delete(res))
    if (mode !== "headers") {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.write(": keep-alive\n\n")
    }
    reached()
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("Missing listening port")
  return {
    port: address.port,
    open,
    requested,
    close: async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

function settles<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("request did not settle")), 1500)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

describe("runtime request lifecycle", () => {
  it.each(["headers", "body"] as const)("cancels a request stalled at %s", async (mode) => {
    const fixture = await runtime(mode)
    const controller = new AbortController()
    try {
      const pending = callNextJsTool(fixture.port, "get_errors", {}, { signal: controller.signal })
      await fixture.requested
      controller.abort(new Error("caller cancelled"))
      await expect(settles(pending)).rejects.toThrow(/cancel|abort/i)
      await expect.poll(() => fixture.open.size, { timeout: 1500 }).toBe(0)
    } finally {
      await fixture.close()
    }
  })

  it("applies a deadline while reading the response body", async () => {
    const fixture = await runtime("body")
    try {
      await expect(
        settles(callNextJsTool(fixture.port, "get_errors", {}, { timeoutMs: 100 }))
      ).rejects.toThrow(/timeout|timed out/i)
      await expect.poll(() => fixture.open.size, { timeout: 1500 }).toBe(0)
    } finally {
      await fixture.close()
    }
  })

  it("cancels a probe response body after reading its status", async () => {
    const fixture = await runtime("probe")
    try {
      expect(await probePort(fixture.port)).toBe("http")
      await expect.poll(() => fixture.open.size, { timeout: 1500 }).toBe(0)
    } finally {
      await fixture.close()
    }
  })

  it("does not send a request when the caller already cancelled", async () => {
    const fixture = await runtime("success")
    const controller = new AbortController()
    controller.abort(new Error("caller cancelled"))
    try {
      await expect(
        callNextJsTool(fixture.port, "get_errors", {}, { signal: controller.signal })
      ).rejects.toThrow(/cancel|abort/i)
    } finally {
      await fixture.close()
    }
  })

  it("still completes a healthy request", async () => {
    const fixture = await runtime("success")
    try {
      expect(await callNextJsTool(fixture.port, "get_errors", {}, { timeoutMs: 1000 })).toEqual({
        content: [],
      })
    } finally {
      await fixture.close()
    }
  })
})
