export const metadata = {
  uri: "nextjs-docs://llms-index",
  name: "Next.js Documentation Index (llms.txt)",
  description:
    "Complete Next.js documentation index from nextjs.org/docs/llms.txt. Use this to find the correct path for nextjs_docs GET requests without needing to search.",
  mimeType: "text/plain",
}

// Cache the llms.txt content with a reasonable TTL (1 hour)
let cachedContent: string | null = null
let cacheTimestamp: number = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function handler(): Promise<string> {
  const now = Date.now()

  // Return cached content if still valid
  if (cachedContent && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedContent
  }

  // Fetch fresh content
  try {
    const response = await fetch("https://nextjs.org/docs/llms.txt")
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    cachedContent = await response.text()
    cacheTimestamp = now
    return cachedContent
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    // If we have stale cached content, return it with a warning
    if (cachedContent) {
      return `Warning: Failed to fetch fresh index (${errorMessage}). Returning cached content.\n\n${cachedContent}`
    }

    // No cached content available, return error
    return `Error: Failed to fetch Next.js documentation index from nextjs.org/docs/llms.txt\n\nError: ${errorMessage}\n\nPlease check your internet connection or try again later.`
  }
}
