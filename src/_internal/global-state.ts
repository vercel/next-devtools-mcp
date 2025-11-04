/**
 * Global state for the MCP server
 * Tracks initialization status and other server-wide state
 */

interface GlobalState {
  initCalled: boolean
  initTimestamp: number | null
}

const globalState: GlobalState = {
  initCalled: false,
  initTimestamp: null,
}

export function markInitCalled(): void {
  globalState.initCalled = true
  globalState.initTimestamp = Date.now()
}

export function isInitCalled(): boolean {
  return globalState.initCalled
}

export function getInitTimestamp(): number | null {
  return globalState.initTimestamp
}

export function resetGlobalState(): void {
  globalState.initCalled = false
  globalState.initTimestamp = null
}
