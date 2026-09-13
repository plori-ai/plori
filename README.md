# plori

**plori (plori.ai): a cloud AI agent with its own persistent environment - durable disk, real CLI tools, and memory.**

[plori](https://plori.ai) provides the agent: each one gets a persistent machine with a real
disk, real tools, and memory of its own. Idle agents scale to
zero. You talk to your agents in the web app, or drive them from your own tools over
MCP and REST.

This repository is the integration front door. The product itself lives at
[plori.ai](https://plori.ai); the remote MCP server lives at `https://api.plori.ai/mcp`.

## Connect your MCP client

plori is a **remote** MCP server (streamable HTTP). There is nothing to install or run
locally. Sign-in happens in your browser via OAuth 2.1 the first time your client
connects; headless environments can use an API key instead.

**Claude Code**

Paste this into your Claude Code conversation:

> Set up https://plori.ai/SKILL.md

Claude reads the setup instructions and configures MCP if needed. If the new server
has not loaded, type `/reload-plugins` when Claude asks, then continue in the same
conversation. With pairing, open the short address Claude shows, enter the code,
sign in, and approve. You can use a phone while Claude Code runs on a remote machine.
No installed skill or plugin is required.

**Cursor**

Use the one-click [Add to Cursor](https://plori.ai/mcp) button, or add manually:
`Settings -> MCP -> Add server` with URL `https://api.plori.ai/mcp`.

**VS Code**

```sh
code --add-mcp '{"name":"plori","type":"http","url":"https://api.plori.ai/mcp"}'
```

**Codex CLI**

```sh
codex mcp add plori --url https://api.plori.ai/mcp
codex mcp login plori
```

Codex auto-detects plori's OAuth on `login`. One-install alternative with the skill
bundled: `codex plugin marketplace add plori-ai/codex-plugin` then `codex plugin add
plori@plori`.

**Cline**

Follow [llms-install.md](./llms-install.md), written for Cline's automated installer.

**Any other client**

Native streamable-HTTP clients connect to `https://api.plori.ai/mcp` directly. Clients
that only speak stdio can bridge with the [`plori-mcp` npm package](https://www.npmjs.com/package/plori-mcp)
(a thin wrapper around `mcp-remote` with the endpoint pinned; this repository is its source):

```sh
npx plori-mcp
# headless / CI: authenticate with an API key instead of the OAuth flow
npx plori-mcp --header "Authorization: Bearer plori_sk_..."
# equivalent, without the wrapper:
npx mcp-remote https://api.plori.ai/mcp
```

API keys are minted in [Dashboard -> Settings](https://plori.ai/dashboard/settings) on
a registered account.

## Or skip MCP: your own terminal

The [plori CLI](https://www.npmjs.com/package/@plori/cli) is not an MCP client. It is a
door of its own, and it opens the same live session the web app shows: the recent
history, a prompt, streaming output, and the approval queue in one place. A turn you
send in the terminal appears in an open browser tab as it streams.

```sh
curl -fsSL https://plori.ai/install.sh | sh
plori login && plori attach <agent-name>
```

The installer drops one static binary in `~/.local/bin` and needs no Node; if that
directory is not on your PATH yet, the script prints the line to add. `npm i -g
@plori/cli` works too. The argument to `attach` is an agent name, an agent id, or a
session id, so a session id copied out of the web app works on its own. `Ctrl-D`
detaches and leaves the run going on the server.

The terminal does not give the agent access to your local files. The shell, the disk,
and the files are the agent's own cloud environment.

## Verify the connection

Ask your client:

> List my plori agents and tell me how many credits I have left.

You should see `list_agents` and `get_credits` tool calls and a real answer.

## What the tools do

The server exposes 23 tools in five groups.

- **Agents** (the Plori Router picks each agent's model per task): `list_agents`
  (your agents, with model and live session status), `get_agent` (one agent's name,
  type, model, and status, plus its mailbox of mail from other agents on the
  account), `create_agent` (get or create an agent by name, which reuses an existing
  agent of that name instead of making a duplicate), `delete_agent` (permanently
  delete an agent and revoke its disk).
- **Runs**: `invoke_agent` (send a message and wait for the reply, with
  `wait_seconds` to set how long to hold, `idempotency_key` to make a retry return
  the original run, and `callback_url` plus `callback_secret` to post a signed
  status notification to your endpoint), `get_run_result` (a run's status,
  timestamps, credits, tokens, tool progress, and the reply once it finishes),
  `list_runs` (an agent's run history, most recent first), `cancel_run` (stop an
  in-flight run, which reports `cancelling` and then `cancelled`), `schedule_run`
  (invoke an agent once later, after a delay or at a timestamp).
- **Human-in-the-loop**: `list_pending_inputs` (runs paused on an approval or an
  input request), `answer_pending_input` (approve, deny, or answer one, which starts
  a continuation run).
- **Workflows**: `list_workflows` (every workflow, or one agent's with `agent_id`,
  or the unassigned ones with `agent_id="none"`), `get_workflow` (metadata and the
  step projection pinned for execution), `get_workflow_version` (one exact version's
  full definition and parameter values), `create_workflow` (an empty workflow on a
  manual, cron, or webhook trigger, for an agent to build), `edit_workflow` (a batch
  of constrained edits as one new draft, under compare-and-swap on `base_version`),
  `run_workflow` (run a built workflow now, as a real, billed execution),
  `list_workflow_executions` (recent executions with status, fault, trigger source,
  timing, and credits), `get_workflow_execution` (one execution's per-step input and
  output payloads).
- **Account**: `get_credits` (balance and plan), `get_usage` (spend by meter and by
  agent), `get_disk` (included, purchased, and used bytes), `list_connections` (your
  third-party OAuth providers with status, authorization and expiry times, and the
  scopes configured for each, never tokens or client secrets).

A turn that is still running when the hold ends continues on the server:
`invoke_agent` returns a `run_id` with status `running` and a `poll_after_seconds`
delay, and you read the answer with `get_run_result` using `wait=true` (or your own
`wait_seconds`, up to 1800).

Costs: creating and running agents spends plori credits from your account. Reading
(lists, results, balances) is free. The [pricing page](https://plori.ai/pricing) has
the details. Revoke a client's access any time in your client's settings, or revoke
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
- Questions: [agent@plori.ai](mailto:agent@plori.ai)
