/**
 * Central configuration for next-devtools-mcp
 *
 * This file contains all configuration constants used throughout the application.
 * Extracting these values to a central location allows for easier tuning and
 * environment-specific overrides without modifying core logic.
 *
 * @module config
 */

/**
 * Application-wide configuration object
 *
 * All values are defined as constants with `as const` to ensure type safety
 * and immutability at compile time.
 */
export const CONFIG = {
  /**
   * Next.js runtime discovery and MCP endpoint configuration
   */
  nextjs_runtime: {
    /**
     * Common ports where Next.js dev servers typically run
     * Used for auto-discovery when port is not explicitly provided
     */
    common_ports: [3000, 3001, 4000, 5000, 8080],

    /**
     * Timeout (in milliseconds) for verifying MCP endpoint availability
     * Short timeout to avoid blocking on non-responsive servers
     */
    mcp_endpoint_timeout_ms: 1000,

    /**
     * Maximum time (in milliseconds) to wait for auto-discovery
     * Includes process scanning and endpoint verification
     */
    auto_discovery_timeout_ms: 5000,
  },

  /**
   * Browser automation configuration (Playwright integration)
   */
  browser: {
    /**
     * Default browser to use when none is specified
     */
    default_browser: "chrome" as const,

    /**
     * Default headless mode setting
     * Headless mode runs browser without UI (faster, uses less resources)
     */
    default_headless: true,

    /**
     * Timeout for checking if Playwright MCP is installed
     */
    installation_check_timeout_ms: 5000,

    /**
     * Environment variables for verbose browser logging
     */
    verbose_logging_env: {
      DEBUG: "pw:api,pw:browser*",
      VERBOSE: "1",
    },
  },

  /**
   * Documentation search configuration
   */
  docs: {
    /**
     * URL for Next.js documentation LLM-optimized text
     * This file contains all Next.js documentation in a format optimized for LLMs
     */
    llms_txt_url: "https://nextjs.org/docs/llms.txt",

    /**
     * Cache time-to-live (in milliseconds) for fetched documentation
     * Set to 1 hour to balance freshness with performance
     */
    cache_ttl_ms: 3600 * 1000,

    /**
     * Maximum number of characters to include in content preview
     * Truncates long documentation to reduce token usage
     */
    max_content_preview_chars: 3000,

    /**
     * Maximum number of search results to return
     * Returns only top N matches to avoid overwhelming context
     */
    max_search_results: 3,

    /**
     * Scoring weights for documentation search algorithm
     * Higher scores indicate stronger relevance
     */
    search_scores: {
      /**
       * Score bonus for query matching the filename
       */
      filename_match: 10,

      /**
       * Score bonus for query appearing in first 500 chars
       */
      content_match: 5,

      /**
       * Score bonus per keyword match in content
       */
      keyword_match: 3,
    },

    /**
     * Maximum number of characters to check for content match
     * Only searches beginning of document for performance
     */
    content_match_preview_chars: 500,
  },

  /**
   * MCP client configuration
   */
  mcp_client: {
    /**
     * Default timeout (in milliseconds) for MCP requests
     */
    request_timeout_ms: 5000,

    /**
     * Prefix for MCP server stderr log messages
     * Helps identify external server logs in combined output
     */
    stderr_logging_prefix: "[MCP Server stderr]",

    /**
     * Client information sent during MCP initialization
     */
    client_info: {
      name: "next-devtools-mcp-client",
      version: "0.2.3",
    },
  },

  /**
   * Resource loading configuration
   */
  resources: {
    /**
     * Directory name where resources are stored in dist/
     */
    dist_resources_dir: "resources",

    /**
     * Regex pattern for numbered markdown files
     * Matches files like "01-overview.md", "12-reference.md"
     */
    numbered_markdown_pattern: /^\d+-.*\.md$/,
  },

  /**
   * Feature flags for enabling/disabling functionality
   */
  features: {
    /**
     * Enable caching of documentation fetched from nextjs.org
     */
    enable_docs_caching: true,

    /**
     * Enable automatic installation of missing dependencies (e.g., playwright-mcp)
     */
    enable_auto_installation: true,

    /**
     * Enable verbose logging for debugging
     * Can be overridden by DEBUG environment variable
     */
    enable_verbose_logging: process.env.DEBUG === "true",
  },
} as const

/**
 * Type representing the application configuration
 * Inferred from the CONFIG object to ensure type safety
 */
export type Config = typeof CONFIG
