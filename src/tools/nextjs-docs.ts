import { z } from "zod"
import { type InferSchema } from "xmcp"

export const schema = {
  action: z
    .enum(["search", "get"])
    .describe(
      "Action to perform: 'search' to find docs by keyword, 'get' to fetch full markdown content"
    ),
  query: z
    .string()
    .optional()
    .describe(
      "Required for 'search' action. Keyword search query (e.g., 'metadata', 'generateStaticParams', 'middleware'). Use specific terms, not natural language questions."
    ),
  path: z
    .string()
    .optional()
    .describe(
      "Required for 'get' action. Doc path from search results (e.g., '/docs/app/api-reference/functions/refresh')"
    ),
  anchor: z
    .string()
    .optional()
    .describe(
      "Optional for 'get' action. Anchor/section from search results (e.g., 'usage'). Included in response metadata to indicate relevant section."
    ),
  routerType: z
    .enum(["all", "app", "pages"])
    .default("all")
    .describe(
      "For 'search' action only. Filter by Next.js router type: 'app' (App Router only), 'pages' (Pages Router only), or 'all' (both)"
    ),
}

export const metadata = {
  name: "nextjs_docs",
  description: `Search and retrieve Next.js official documentation.
Two-step process: 1) Use action='search' with a keyword query to find relevant docs and get their paths. 2) Use action='get' with a specific path to fetch the full markdown content.
Use specific API names, concepts, or feature names as search terms.`,
}

export default async function nextjsDocs({
  action,
  query,
  path,
  anchor,
  routerType = "all",
}: InferSchema<typeof schema>): Promise<string> {
  if (action === "search") {
    if (!query) {
      throw new Error("query parameter is required for search action")
    }

    // Construct filters based on router type
    let filters = "isPages:true OR isApp:true"
    if (routerType === "app") {
      filters = "isApp:true"
    } else if (routerType === "pages") {
      filters = "isPages:true"
    }

    // Call Next.js search API
    const response = await fetch("https://nextjs.org/api/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        indexName: "nextjs_docs_stable",
        query,
        filters,
      }),
    })

    if (!response.ok) {
      throw new Error(`Next.js docs API error: ${response.status} ${response.statusText}`)
    }

    const { hits = [] } = await response.json()

    if (hits.length === 0) {
      return JSON.stringify({
        query,
        routerType,
        results: [],
        message: "No documentation found.",
      })
    }

    // Extract only essential fields to reduce payload
    const results = hits.map((hit: any) => ({
      title: hit.title,
      path: hit.path,
      content: hit.content,
      section: hit.section,
      anchor: hit.anchor,
      routerType: hit.isApp ? "app" : hit.isPages ? "pages" : "unknown",
    }))

    return JSON.stringify({
      query,
      routerType,
      results,
    })
  } else if (action === "get") {
    if (!path) {
      throw new Error("path parameter is required for get action")
    }

    const url = `https://nextjs.org${path}`
    const response = await fetch(url, {
      headers: {
        Accept: "text/markdown",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documentation: ${response.status} ${response.statusText}`)
    }

    const markdown = await response.text()
    return JSON.stringify({
      path,
      anchor: anchor || null,
      url: anchor ? `https://nextjs.org${path}#${anchor}` : `https://nextjs.org${path}`,
      content: markdown,
    })
  } else {
    throw new Error(`Invalid action: ${action}`)
  }
}
