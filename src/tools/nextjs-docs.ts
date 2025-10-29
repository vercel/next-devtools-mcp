import { z } from "zod"
import { type InferSchema } from "xmcp"

export const schema = {
  query: z.string().describe("Search query to find relevant Next.js documentation"),
  routerType: z
    .enum(["all", "app", "pages"])
    .optional()
    .default("all")
    .describe("Filter by router type: 'app' (App Router) or 'pages' (Pages Router)"),
}

export const metadata = {
  name: "nextjs_docs",
  description: "Search Next.js official documentation",
}

const ALGOLIA_APP_ID = ""
const ALGOLIA_API_KEY = ""

const algoliaHitSchema = z.object({
  title: z.string(),
  content: z.string(),
  path: z.string(),
  section: z.string().optional(),
  anchor: z.string().optional(),
  isApp: z.boolean().optional(),
  isPages: z.boolean().optional(),
})

const algoliaResponseSchema = z.object({
  results: z.array(
    z.object({
      hits: z.array(algoliaHitSchema),
    })
  ),
})

type AlgoliaHit = z.infer<typeof algoliaHitSchema>

async function searchAlgolia(query: string, filters?: string): Promise<AlgoliaHit[]> {
  const response = await fetch("https://NNTAHQI9C5-dsn.algolia.net/1/indexes/*/queries", {
    method: "POST",
    headers: {
      "X-Algolia-API-Key": ALGOLIA_API_KEY,
      "X-Algolia-Application-Id": ALGOLIA_APP_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          indexName: "nextjs_docs_stable",
          query,
          params: filters ? `hitsPerPage=10&filters=${filters}` : "hitsPerPage=10",
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Algolia search failed: ${response.statusText}`)
  }

  const json = await response.json()
  const data = algoliaResponseSchema.parse(json)
  return data.results[0]?.hits ?? []
}

function formatSearchResults(hits: AlgoliaHit[], query: string): string {
  if (hits.length === 0) {
    return `No documentation found for "${query}".`
  }

  let result = `Found ${hits.length} result(s) for "${query}":\n\n`

  for (const hit of hits) {
    result += `## ${hit.title}\n`

    if (hit.section && hit.section !== hit.title) {
      result += `**Section:** ${hit.section}\n`
    }

    result += `**URL:** https://nextjs.org${hit.path}${hit.anchor ? `#${hit.anchor}` : ""}\n`

    const routerBadge = hit.isApp ? "[App Router]" : hit.isPages ? "[Pages Router]" : ""
    if (routerBadge) {
      result += `**Router:** ${routerBadge}\n`
    }

    if (hit.content) {
      result += `\n${hit.content}\n`
    }

    result += "\n---\n\n"
  }

  return result
}

export default async function nextjsDocs({
  query,
  routerType = "all",
}: InferSchema<typeof schema>): Promise<string> {
  try {
    let filters: string | undefined

    if (routerType === "app") {
      filters = "isApp:true"
    } else if (routerType === "pages") {
      filters = "isPages:true"
    }

    const hits = await searchAlgolia(query, filters)

    return formatSearchResults(hits, query)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return `Error searching Next.js documentation: ${errorMessage}`
  }
}
