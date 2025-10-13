import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js"

export const testWithChromePrompt: Prompt = {
  name: "test-with-chrome",
  description:
    "Run browser tests using Chrome DevTools by interpreting natural language test scripts",
  arguments: [
    {
      name: "test_script",
      description:
        "Natural language test script describing what to test (can include multiple steps and assertions)",
      required: true,
    },
    {
      name: "base_url",
      description: "Base URL for the application (e.g., http://localhost:3000)",
      required: false,
    },
  ],
}

export function getTestWithChromePrompt(args?: Record<string, string>): GetPromptResult {
  const testScript = args?.test_script || ""
  const baseUrl = args?.base_url || "http://localhost:3000"

  return {
    description: testWithChromePrompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a browser testing assistant. Your task is to interpret the following natural language test script and execute it using the chrome_devtools tool.

TEST SCRIPT:
${testScript}

BASE URL: ${baseUrl}

INSTRUCTIONS:

1. Break down the test script into individual actions
2. For each action, make a chrome_devtools tool call
3. Use these patterns:

   - Navigate: chrome_devtools({ action: "navigate", url: "..." })
   
   - Click element: chrome_devtools({ action: "evaluate", script: "document.querySelector('selector').click()" })
   
   - Type into input: chrome_devtools({ action: "evaluate", script: "const input = document.querySelector('selector'); input.value = 'text'; input.dispatchEvent(new Event('input', { bubbles: true }));" })
   
   - Check element exists: chrome_devtools({ action: "evaluate", script: "document.querySelector('selector') !== null" })
   
   - Get element text: chrome_devtools({ action: "evaluate", script: "document.querySelector('selector')?.textContent" })
   
   - Check URL: chrome_devtools({ action: "evaluate", script: "window.location.href" })
   
   - Wait (if needed): chrome_devtools({ action: "evaluate", script: "new Promise(resolve => setTimeout(resolve, 2000))" })
   
   - Check for errors: chrome_devtools({ action: "console" })

4. Execute actions sequentially, waiting for each to complete before the next
5. Report results clearly, including any assertions that pass or fail
6. If any step fails, explain what went wrong
7. End by checking for console errors

Execute the test script now.`,
        },
      },
    ],
  }
}

