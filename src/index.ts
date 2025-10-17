#!/usr/bin/env node
/**
 * Standalone MCP Server using StdioServerTransport
 * This file can be run directly without needing Next.js
 */

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
import { ZodError } from "zod"
import { MCP_TOOLS } from "./mcp-tools/index.js"
import { MCP_PROMPTS, PROMPT_HANDLERS } from "./mcp-prompts/index.js"
import {
  getNextjs16KnowledgeResources,
  readKnowledgeSection,
  isNextjs16KnowledgeUri,
} from "./mcp-resources/nextjs-16-knowledge.js"

async function main() {
  // Create MCP server instance
  const server = new Server(
    {
      name: "next-devtools-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  )

  // Register tools/list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = Object.entries(MCP_TOOLS).map(([name, tool]) => ({
      name,
      description: tool.description || `Tool: ${name}`,
      inputSchema: tool.inputSchema as any,
    }))

    return { tools }
  })

  // Register tools/call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    const tool = MCP_TOOLS[name as keyof typeof MCP_TOOLS]
    if (!tool) {
      throw new Error(
        `Tool not found: ${name}. Available tools: ${Object.keys(MCP_TOOLS).join(", ")}`
      )
    }

    try {
      // Validate arguments against the tool's input schema
      let validatedArgs = args || {}
      if (tool.inputSchema && typeof (tool.inputSchema as any).parse === "function") {
        try {
          validatedArgs = (tool.inputSchema as any).parse(args || {})
        } catch (error) {
          // Format Zod validation errors for better user experience
          if (error instanceof ZodError) {
            const formattedErrors = (error as any).issues
              .map((err: any) => {
                const path = err.path.length > 0 ? `${err.path.join(".")}` : "arguments"
                return `${path}: ${err.message}`
              })
              .join("; ")
            throw new Error(`Invalid arguments - ${formattedErrors}`)
          }
          throw error
        }
      }

      const result = await tool.execute?.(validatedArgs as any, {
        abortSignal: new AbortController().signal,
        messages: [],
        toolCallId: String(request.params._meta?.progressToken || Date.now()),
      })

      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Tool execution failed: ${errorMessage}`)
    }
  })

  // Register prompts/list handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: Object.values(MCP_PROMPTS),
    }
  })

  // Register prompts/get handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    const handler = PROMPT_HANDLERS[name]
    if (!handler) {
      throw new Error(`Prompt not found: ${name}`)
    }

    return handler(args)
  })

  // Register resources/list handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = getNextjs16KnowledgeResources()

    return { resources }
  })

  // Register resources/read handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params

    if (!isNextjs16KnowledgeUri(uri)) {
      throw new Error(`Unknown resource URI: ${uri}`)
    }

    try {
      const content = readKnowledgeSection(uri)

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to read resource: ${errorMessage}`)
    }
  })

  // Create stdio transport
  const transport = new StdioServerTransport()

  // Connect server to transport
  await server.connect(transport)

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error("Next.js DevTools MCP Server connected")
}

// Run the server
main().catch((error) => {
  console.error("Fatal error running MCP server:", error)
  process.exit(1)
})

