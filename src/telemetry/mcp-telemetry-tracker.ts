export type McpToolName =
  | "mcp/browser_eval"
  | "mcp/nextjs_docs"
  | "mcp/nextjs_index"
  | "mcp/nextjs_call"

export interface McpToolUsage {
  featureName: McpToolName
  invocationCount: number
}

class McpTelemetryTracker {
  private usageMap = new Map<McpToolName, number>()

  recordToolCall(toolName: McpToolName): void {
    const current = this.usageMap.get(toolName) || 0
    this.usageMap.set(toolName, current + 1)
  }

  getUsages(): McpToolUsage[] {
    return Array.from(this.usageMap.entries()).map(([featureName, invocationCount]) => ({
      featureName,
      invocationCount,
    }))
  }

  reset(): void {
    this.usageMap.clear()
  }

  hasUsage(): boolean {
    return this.usageMap.size > 0
  }
}

export const mcpTelemetryTracker = new McpTelemetryTracker()

export function getMcpTelemetryUsage(): McpToolUsage[] {
  return mcpTelemetryTracker.getUsages()
}

export function resetMcpTelemetry(): void {
  mcpTelemetryTracker.reset()
}
