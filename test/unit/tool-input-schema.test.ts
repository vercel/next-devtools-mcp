import { describe, expect, it } from "vitest"
import { z } from "zod"
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv-provider.js"
import { toolInputSchema } from "../../src/_internal/tool-input-schema.js"
import { inputSchema as call } from "../../src/tools/nextjs_call.js"
import { inputSchema as index } from "../../src/tools/nextjs_index.js"

describe("advertised tool input schemas", () => {
  const jsonSchema = toolInputSchema(call)
  const validate = new AjvJsonSchemaValidator().getValidator(jsonSchema)

  it.each([
    { port: 3000, toolName: "get_errors" },
    { port: "3000", toolName: "get_server_action_by_id", args: { actionId: "test" } },
    { port: 3000, toolName: "example", args: { nested: { value: [null, true, 1] } } },
  ])("accepts the same valid arguments as the tool: %j", (args) => {
    expect(validate(args).valid).toBe(true)
    expect(z.object(call).safeParse(args).success).toBe(true)
  })

  it.each([
    {},
    { port: "3000" },
    { toolName: "get_errors" },
    { port: "3000", toolName: "get_errors", args: "{}" },
    { port: false, toolName: "get_errors" },
  ])("rejects the same invalid arguments as the tool: %j", (args) => {
    expect(validate(args).valid).toBe(false)
    expect(z.object(call).safeParse(args).success).toBe(false)
  })

  it("preserves descriptions and keeps discovery's port optional", () => {
    const properties = jsonSchema.properties as Record<string, { description?: string }>
    expect(properties.args.description).toContain("MUST be an object")
    const validateIndex = new AjvJsonSchemaValidator().getValidator(toolInputSchema(index))
    expect(validateIndex({}).valid).toBe(true)
    expect(validateIndex({ port: 3000 }).valid).toBe(true)
    expect(validateIndex({ port: "3000" }).valid).toBe(true)
  })
})
