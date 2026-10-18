# plori

**Plori runs AI agents that collaborate on one product in the cloud.**

[Plori](https://plori.ai) runs AI agents that collaborate on one product in the cloud.
Code, research, content: each works on its own copy, and Plori merges their changes
back. The agents work in a cloud Workspace that keeps the product's files with saved
revisions. Only the Workspace files persist between runs. You talk to your
agents in the web app, or drive them from your own tools over MCP and REST.

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

The terminal does not give the agent access to your local files. The shell and the
Workspace files are in Plori's cloud.

## Verify the connection

Ask your client:

> List my plori Workspaces and tell me how many credits I have left.

You should see `list_workspaces` and `get_credits` tool calls and a real answer.

## What the tools do

The server exposes 24 tools in five groups. A Workspace holds durable files with
saved revisions, a main conversation, and run history. An agent runs in a Workspace
with a shell and the Workspace files under `/workspace`.

- **Workspaces and account**: `list_workspaces` (the Workspaces you own, with state,
  default agent, current revision, and `storage_readiness` while storage starts),
  `create_workspace` (a Workspace with its first revision. Unless you pass
  `default_manager_agent_id`, it also creates a default agent. `idempotency_key`
  makes a retry return the same Workspace), `delete_workspace` (permanently delete a
  Workspace with its files, revisions, copies, and conversations),
  `read_workspace_file` (a file or a directory listing in a saved revision),
  `upload_workspace_file` (write a file into a Workspace's current files, replacing
  any file at path; pass UTF-8 text as `content`, or omit `content` for a one-time
  `upload_url` for a larger or binary file),
  `get_workspace_costs` (the amount charged for the runs of a Workspace or of one
  task group in a time window), `get_credits` (prepaid balance, plan, and limits).
- **Runs**: `send_workspace_message` (send a message to a Workspace conversation and
  wait for the reply, with `wait_seconds` to set how long to hold, `idempotency_key`
  to make a retry return the original run, and `callback_url` plus `callback_secret`
  to post a signed status notification to your endpoint), `get_run_result` (a run's
  status, timestamps, credits, tokens, tool progress, and the reply once it
  finishes), `list_runs` (an agent's run history, most recent first), `cancel_run`
  (stop an in-flight run, which reports `cancelling` and then `cancelled`),
  `schedule_run` (run an agent once later, after a delay or at a timestamp. It
  returns `awaiting_confirmation` and a `confirm_url`. Plori queues the run only
  after you confirm it in the Plori web app).
- **Human-in-the-loop**: `list_pending_inputs` (runs paused on an approval or an
  input request), `answer_pending_input` (deny one, or answer an agent's question,
  which starts a continuation run). An MCP client cannot approve an action: each
  paused approval carries an `approve_url` that you open in the Plori web app.
- **Workers**: `create_workspace_worker` (start an agent on its own copy of the
  Workspace files, so several workers run at the same time without changing each
  other's files), `list_workspace_workers` and `get_workspace_worker` (status, run,
  and whether Plori saved the worker's files), `steer_workspace_worker` (send a
  message into a running worker's turn), `stop_workspace_task_group` (stop every
  worker of a task group).
- **Changesets**: when a worker's run completes normally and changes at least one
  file, Plori submits its saved files and accepts a clean comparison itself.
  `submit_workspace_changeset` (submit the saved files of a worker whose run ended
  in error, was cancelled or was stopped, for comparison with the Workspace's
  current files), `list_workspace_changesets` and
  `get_workspace_changeset` (state, phase, and changed and conflicting paths),
  `accept_workspace_changeset` (the worker's changes become the Workspace's current
  files as a new revision), `reject_workspace_changeset` (keep the Workspace files
  as they are).

A turn that is still running when the hold ends continues on the server:
`send_workspace_message` returns a `run_id` with status `running` and a
`poll_after_seconds` delay, and you read the answer with `get_run_result` using
`wait=true` (or your own `wait_seconds`, up to 1800).

Costs: running agents spends plori credits from your account. Reading
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
