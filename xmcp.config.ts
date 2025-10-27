import { XmcpConfig } from "xmcp"

const config: XmcpConfig = {
  stdio: true,
  paths: {
    tools: "src/tools",
    prompts: "src/prompts",
    resources: "src/resources",
  },
}

export default config
