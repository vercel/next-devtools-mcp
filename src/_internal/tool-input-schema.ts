import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js"
import { z } from "zod"

export function toolInputSchema(shape: Record<string, z.ZodTypeAny>) {
  // Describe inputs before transforms (e.g. string OR numeric ports).
  return toJsonSchemaCompat(z.object(shape), { pipeStrategy: "input" })
}
