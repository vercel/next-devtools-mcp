#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

// Import tools
import * as browserEval from "./tools/browser-eval.js"
import * as enableCacheComponents from "./tools/enable-cache-components.js"
import * as init from "./tools/init.js"
import * as nextjsDocs from "./tools/nextjs-docs.js"
import * as nextjsRuntime from "./tools/nextjs-runtime.js"
import * as upgradeNextjs16 from "./tools/upgrade-nextjs-16.js"

// Import prompts
import * as upgradeNextjs16Prompt from "./prompts/upgrade-nextjs-16.js"
import * as enableCacheComponentsPrompt from "./prompts/enable-cache-components.js"

// Import resources
import * as cacheComponentsOverview from "./resources/(cache-components)/overview.js"
import * as cacheComponentsCoreMechanics from "./resources/(cache-components)/core-mechanics.js"
import * as cacheComponentsPublicCaches from "./resources/(cache-components)/public-caches.js"
import * as cacheComponentsPrivateCaches from "./resources/(cache-components)/private-caches.js"
import * as cacheComponentsRuntimePrefetching from "./resources/(cache-components)/runtime-prefetching.js"
import * as cacheComponentsRequestApis from "./resources/(cache-components)/request-apis.js"
import * as cacheComponentsCacheInvalidation from "./resources/(cache-components)/cache-invalidation.js"
import * as cacheComponentsAdvancedPatterns from "./resources/(cache-components)/advanced-patterns.js"
import * as cacheComponentsBuildBehavior from "./resources/(cache-components)/build-behavior.js"
import * as cacheComponentsErrorPatterns from "./resources/(cache-components)/error-patterns.js"
import * as cacheComponentsTestPatterns from "./resources/(cache-components)/test-patterns.js"
import * as cacheComponentsReference from "./resources/(cache-components)/reference.js"
import * as nextjsFundamentalsUseClient from "./resources/(nextjs-fundamentals)/use-client.js"
import * as nextjs16BetaToStable from "./resources/(nextjs16)/migration/beta-to-stable.js"
import * as nextjs16Examples from "./resources/(nextjs16)/migration/examples.js"

// Tool registry
const tools = [
  browserEval,
  enableCacheComponents,
  init,
  nextjsDocs,
  nextjsRuntime,
  upgradeNextjs16,
]

// Prompt registry
const prompts = [upgradeNextjs16Prompt, enableCacheComponentsPrompt]

// Resource registry
const resources = [
  cacheComponentsOverview,
  cacheComponentsCoreMechanics,
  cacheComponentsPublicCaches,
  cacheComponentsPrivateCaches,
  cacheComponentsRuntimePrefetching,
  cacheComponentsRequestApis,
  cacheComponentsCacheInvalidation,
  cacheComponentsAdvancedPatterns,
  cacheComponentsBuildBehavior,
  cacheComponentsErrorPatterns,
  cacheComponentsTestPatterns,
  cacheComponentsReference,
  nextjsFundamentalsUseClient,
  nextjs16BetaToStable,
  nextjs16Examples,
]

// Create server
const server = new Server(
  {
    name: "next-devtools-mcp",
    version: "0.2.6",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
)

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.metadata.name,
      description: tool.metadata.description,
      inputSchema: {
        type: "object",
        properties: Object.entries(tool.inputSchema).reduce(
          (acc, [key, zodSchema]) => {
            acc[key] = zodSchemaToJsonSchema(zodSchema)
            return acc
          },
          {} as Record<string, any>
        ),
      },
    })),
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  const tool = tools.find((t) => t.metadata.name === name)
  if (!tool) {
    throw new Error(`Tool not found: ${name}`)
  }

  // Validate arguments with Zod schema
  const parsedArgs = validateToolArgs(tool.inputSchema, args || {})

  // Call the tool handler (cast to any to work around TypeScript union type limitations)
  const result = await (tool.handler as any)(parsedArgs)

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  }
})

// Register prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map((prompt) => ({
      name: prompt.metadata.name,
      description: prompt.metadata.description,
    })),
  }
})

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  const prompt = prompts.find((p) => p.metadata.name === name)
  if (!prompt) {
    throw new Error(`Prompt not found: ${name}`)
  }

  // Validate arguments if schema exists
  let parsedArgs = args || {}
  if (prompt.inputSchema) {
    parsedArgs = validateToolArgs(prompt.inputSchema, args || {})
  }

  // Get the prompt content
  const content = await prompt.handler(parsedArgs)

  return {
    messages: [
      {
        role: prompt.metadata.role || "user",
        content: {
          type: "text",
          text: content,
        },
      },
    ],
  }
})

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map((resource) => ({
      uri: resource.metadata.uri,
      name: resource.metadata.name,
      description: resource.metadata.description,
      mimeType: resource.metadata.mimeType || "text/markdown",
    })),
  }
})

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  const resource = resources.find((r) => r.metadata.uri === uri)
  if (!resource) {
    throw new Error(`Resource not found: ${uri}`)
  }

  // Get the resource content
  const content = await resource.handler()

  return {
    contents: [
      {
        uri,
        mimeType: resource.metadata.mimeType || "text/markdown",
        text: content,
      },
    ],
  }
})

// Helper function to convert Zod schema to JSON Schema (simplified)
function zodSchemaToJsonSchema(zodSchema: any): any {
  // Get the description
  const description = zodSchema._def?.description

  // Handle different Zod types
  if (zodSchema._def?.typeName === "ZodString") {
    return { type: "string", description }
  }
  if (zodSchema._def?.typeName === "ZodNumber") {
    return { type: "number", description }
  }
  if (zodSchema._def?.typeName === "ZodBoolean") {
    return { type: "boolean", description }
  }
  if (zodSchema._def?.typeName === "ZodArray") {
    return {
      type: "array",
      description,
      items: zodSchemaToJsonSchema(zodSchema._def.type),
    }
  }
  if (zodSchema._def?.typeName === "ZodObject") {
    const shape = zodSchema._def.shape()
    const properties: Record<string, any> = {}
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodSchemaToJsonSchema(value)
    }
    return { type: "object", description, properties }
  }
  if (zodSchema._def?.typeName === "ZodEnum") {
    return { type: "string", enum: zodSchema._def.values, description }
  }
  if (zodSchema._def?.typeName === "ZodOptional") {
    return zodSchemaToJsonSchema(zodSchema._def.innerType)
  }
  if (zodSchema._def?.typeName === "ZodUnion") {
    // Handle union types (for boolean | string transforms)
    const options = zodSchema._def.options
    if (options.length === 2) {
      return zodSchemaToJsonSchema(options[0])
    }
  }

  // Default fallback
  return { type: "string", description }
}

// Helper function to validate tool arguments with Zod
function validateToolArgs(schema: Record<string, any>, args: any): any {
  const result: Record<string, any> = {}

  for (const [key, zodSchema] of Object.entries(schema)) {
    if (args[key] !== undefined) {
      // Let Zod handle the validation and transformation
      const parsed = zodSchema.safeParse(args[key])
      if (parsed.success) {
        result[key] = parsed.data
      } else {
        throw new Error(`Invalid argument '${key}': ${parsed.error.message}`)
      }
    } else if (!zodSchema.isOptional()) {
      // Check if required
      throw new Error(`Missing required argument: ${key}`)
    }
  }

  return result
}

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error("Server error:", error)
  process.exit(1)
})
