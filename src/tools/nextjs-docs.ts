import { z } from "zod"
import { isInitCalled } from "../_internal/global-state.js"

export const inputSchema = {
  action: z
    .enum(["search", "get", "force-search"])
    .describe(
      "Action to perform: 'search' to find docs by keyword, 'get' to fetch full markdown content, 'force-search' to bypass init check and force search"
    ),
  query: z
    .string()
    .optional()
    .describe(
      "Required for 'search' and 'force-search' actions. Keyword search query (e.g., 'metadata', 'generateStaticParams', 'middleware'). Use specific terms, not natural language questions."
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
      "For 'search' and 'force-search' actions only. Filter by Next.js router type: 'app' (App Router only), 'pages' (Pages Router only), or 'all' (both)"
    ),
}

type NextjsDocsArgs = {
  action: "search" | "get" | "force-search"
  query?: string
  path?: string
  anchor?: string
  routerType?: "all" | "app" | "pages"
}

export const metadata = {
  name: "nextjs_docs",
  description: `Search and retrieve Next.js official documentation.
Three actions: 1) 'get' - Fetch full docs with a path (preferred after init). 2) 'search' - Find docs by keyword (redirects to use llms.txt index if init was called). 3) 'force-search' - Bypass init check and force API search (escape hatch only).
After calling init, prefer using 'get' directly with paths from the llms.txt index.`,
}

export async function handler({
  action,
  query,
  path,
  anchor,
  routerType = "all",
}: NextjsDocsArgs): Promise<string> {
  if (action === "search" || action === "force-search") {
    if (!query) {
      throw new Error("query parameter is required for search action")
    }

    // If init has been called and action is 'search' (not 'force-search'), redirect to use llms.txt
    if (action === "search" && isInitCalled()) {
      return JSON.stringify({
        error: "SEARCH_NOT_NEEDED",
        message: `You already have the complete Next.js docs index from the init tool. Find the path for "${query}" in that llms.txt content, then call action='get' directly. If you cannot locate it in llms.txt, use action='force-search' instead.`,
      })
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

    // Define type for search hit
    interface SearchHit {
      title: string
      path: string
      content: string
      section?: string
      anchor?: string
      isApp?: boolean
      isPages?: boolean
    }

    // Extract only essential fields to reduce payload
    const results = hits.map((hit: SearchHit) => ({
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
      forced: action === "force-search",
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
