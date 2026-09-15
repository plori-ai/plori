# Installing the plori MCP server (for automated installers)

plori is a **remote** MCP server. There is no package to download, no binary to build,
and no local process to run. Installation is exactly one configuration entry pointing
at the hosted endpoint.

- Endpoint: `https://api.plori.ai/mcp`
- Transport: streamable HTTP
- Auth: OAuth 2.1 in the browser on first use (default), or an API key header for
  headless use

## Claude Code

Paste this into your Claude Code conversation:

> Set up https://plori.ai/SKILL.md

Claude reads the setup instructions and configures MCP if needed. If the new server
has not loaded, type `/reload-plugins` when Claude asks, then continue in the same
conversation. With pairing, open the short address Claude shows, enter the code,
sign in, and approve. You can use a phone while Claude Code runs on a remote machine.
If a client policy blocks the pairing request, Claude switches to its browser OAuth
flow. Paste the final localhost callback URL only if that browser redirect cannot
connect, and only into that Claude Code session. No installed skill or plugin is
required.

## Cline

Add this entry to `cline_mcp_settings.json` (Cline -> MCP Servers -> Configure):

```json
{
  "mcpServers": {
    "plori": {
      "type": "streamableHttp",
      "url": "https://api.plori.ai/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If this Cline version does not support remote `streamableHttp` servers, bridge through
stdio instead:

```json
{
  "mcpServers": {
    "plori": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.plori.ai/mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Authentication

On the first tool call the server returns an OAuth challenge; the client opens a
browser window, the user signs in with their email (one-time code, no password), and
the connection completes. No secrets are stored in the config file.

For headless machines, mint an API key at https://plori.ai/dashboard/settings
(registered account required) and pass it as a header instead of OAuth:

```json
{
  "mcpServers": {
    "plori": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.plori.ai/mcp",
        "--header",
        "Authorization: Bearer plori_sk_YOUR_KEY"
      ]
    }
  }
}
```

## Verify

Send the prompt: "List my plori agents and tell me how many credits I have left."
Expect `list_agents` and `get_credits` tool calls to succeed. A fresh account has no
agents yet; an empty list is a correct result.

## Notes for the installer

- Do not attempt `npm install`, `pip install`, or a git clone; there is nothing local.
- The server exposes 23 tools (agents, runs, human-in-the-loop, scheduling, workflows,
  and account reads). Creating and invoking agents spends the user's plori credits;
  read-only tools are free.
- Full connect guide: https://plori.ai/mcp (also serves Markdown with `Accept:
  text/markdown` or at https://plori.ai/mcp.md)
