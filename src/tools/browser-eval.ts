import { z } from "zod"
import { execSync } from "child_process"

// agent-browser is a standalone CLI (https://github.com/vercel-labs/agent-browser)
// that performs fast, native browser automation for agents. Rather than embedding
// a browser-automation server, browser_eval is a gateway: it detects whether
// agent-browser is installed and tells the agent how to install and drive it.
const AGENT_BROWSER_PACKAGE = "agent-browser"
const INSTALL_COMMAND = "npm install -g agent-browser"
const SETUP_COMMAND = "agent-browser install"
const SKILLS_ENTRYPOINT = "agent-browser skills get core --full"

export const inputSchema = {
  task: z
    .string()
    .optional()
    .describe(
      "Optional: what you want to do in the browser (e.g. 'open localhost:3000 and check for console errors'). Used only to tailor the guidance."
    ),
}

type BrowserEvalArgs = {
  task?: string
}

export const metadata = {
  name: "browser_eval",
  description: `Set up and use browser automation for this project via the agent-browser CLI.

This tool does NOT drive the browser itself. It points you at \`agent-browser\` — a fast, native browser-automation CLI built for agents (https://github.com/vercel-labs/agent-browser) — and tells you how to install it (if needed) and where to start. You then run its commands directly (you have shell access), which is faster and more capable than proxying automation through MCP.

Call this when you need to open pages, click, type, screenshot, or capture console errors in a real browser.`,
}

function detectAgentBrowser(): { installed: boolean; version: string | null } {
  try {
    const probe =
      process.platform === "win32"
        ? "where agent-browser"
        : "command -v agent-browser"
    const resolved = execSync(probe, { stdio: "pipe" }).toString().trim()
    if (!resolved) return { installed: false, version: null }
  } catch {
    return { installed: false, version: null }
  }

  let version: string | null = null
  try {
    version = execSync("agent-browser --version", { stdio: "pipe" })
      .toString()
      .trim()
  } catch {
    // Installed but version probe failed — not important.
  }
  return { installed: true, version }
}

export async function handler({ task }: BrowserEvalArgs): Promise<string> {
  const { installed, version } = detectAgentBrowser()

  if (installed) {
    return JSON.stringify({
      status: "use_agent_browser",
      tool: AGENT_BROWSER_PACKAGE,
      version,
      instructions: [
        `agent-browser is installed. Drive the browser by running its CLI directly.`,
        `First, load its usage guide so you use the right commands and selectors: \`${SKILLS_ENTRYPOINT}\``,
        `Then run commands such as: \`agent-browser open <url>\`, \`agent-browser click <selector>\`, \`agent-browser type <selector> <text>\`, \`agent-browser screenshot\`.`,
        task
          ? `For your task ("${task}"), open the page first, then use the commands from the skill guide.`
          : null,
      ].filter(Boolean),
    })
  }

  return JSON.stringify({
    status: "install_required",
    tool: AGENT_BROWSER_PACKAGE,
    instructions: [
      `Install the agent-browser CLI: \`${INSTALL_COMMAND}\``,
      `Download its managed Chrome (first run only): \`${SETUP_COMMAND}\``,
      `Then load its usage guide before driving the browser: \`${SKILLS_ENTRYPOINT}\``,
      `After that, run commands directly, e.g. \`agent-browser open <url>\`.`,
    ],
  })
}
