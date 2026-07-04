# plori

**Give your AI agent its own cloud computer.**

[plori](https://plori.ai) hosts agents: each one gets a persistent machine with a real
disk, real tools, and memory that survives between conversations. Idle agents scale to
zero. You talk to your agents in the web app, or drive them from your own tools over
MCP and REST.

This repository is the integration front door. The product itself lives at
[plori.ai](https://plori.ai); the remote MCP server lives at `https://api.plori.ai/mcp`.

## Connect your MCP client

plori is a **remote** MCP server (streamable HTTP). There is nothing to install or run
locally. Sign-in happens in your browser via OAuth 2.1 the first time your client
connects; headless environments can use an API key instead.

**Claude Code**

```sh
claude mcp add --transport http plori https://api.plori.ai/mcp
```

**Cursor**

Use the one-click [Add to Cursor](https://plori.ai/mcp) button, or add manually:
`Settings -> MCP -> Add server` with URL `https://api.plori.ai/mcp`.

**VS Code**

```sh
code --add-mcp '{"name":"plori","type":"http","url":"https://api.plori.ai/mcp"}'
```

**Cline**

Follow [llms-install.md](./llms-install.md), written for Cline's automated installer.

**Any other client**

Native streamable-HTTP clients connect to `https://api.plori.ai/mcp` directly. Clients
that only speak stdio can bridge with the [`plori` npm package](https://www.npmjs.com/package/plori)
(a thin wrapper around `mcp-remote` with the endpoint pinned; this repository is its source):

```sh
npx plori
# headless / CI: authenticate with an API key instead of the OAuth flow
npx plori --header "Authorization: Bearer plori_sk_..."
# equivalent, without the wrapper:
npx mcp-remote https://api.plori.ai/mcp
```

API keys are minted in [Dashboard -> Settings](https://plori.ai/dashboard/settings) on
a registered account.

## Verify the connection

Ask your client:

> List my plori agents and tell me how many credits I have left.

You should see `list_agents` and `get_credits` tool calls and a real answer.

## What the tools do

The server exposes 15 tools in four groups:

- **Agents**: list, inspect, create, and delete agents; pick the model an agent runs.
- **Runs**: invoke an agent and read its reply (blocking or fire-and-forget), list
  runs, fetch a past result.
- **Human-in-the-loop**: list an agent's pending questions and answer them.
- **Scheduling**: schedule a deferred run so an agent works while you are away.

Costs: creating and running agents spends plori credits from your account. Reading
(lists, results, balances) is free. The [pricing page](https://plori.ai/pricing) has
the details; revoke a client's access any time in your client's settings, or revoke
the API key in Dashboard -> Settings.

## For AI agents reading this

The machine-readable entry points:

- Front door: [plori.ai/agents.md](https://plori.ai/agents.md)
- Site index: [plori.ai/llms.txt](https://plori.ai/llms.txt)
- Skill: [SKILL.md](https://plori.ai/.well-known/agent-skills/plori/SKILL.md)
  (index: `/.well-known/agent-skills/index.json`)
- MCP server card: `https://api.plori.ai/mcp/server-card`
- OAuth discovery: RFC 9728 protected-resource metadata on `api.plori.ai`, dynamic
  client registration supported
- Registry entry: [`ai.plori/plori`](https://registry.modelcontextprotocol.io/v0/servers?search=ai.plori/plori)
  in the official MCP Registry

Every page on plori.ai is also served as Markdown: append `.md` to the path or send
`Accept: text/markdown`.

## Docs and support

- [Connect guide](https://plori.ai/mcp) (per-client, kept current)
- [Docs](https://plori.ai/docs)
- [Privacy](https://plori.ai/privacy) and [terms](https://plori.ai/terms)
- Questions: [dev@plori.ai](mailto:dev@plori.ai)
