#!/usr/bin/env node
// Stdio bridge to plori's hosted MCP server. Everything real happens in mcp-remote;
// this wrapper only pins the endpoint so `npx plori` is a complete client config.
// Auth options:
//   - none: mcp-remote runs the OAuth sign-in flow in your browser (default).
//   - PLORI_API_KEY=plori_sk_... env: sent as a Bearer header (headless/CI friendly).
//   - Extra args pass through, e.g.: npx plori --header "Authorization: Bearer plori_sk_..."
"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");

const ENDPOINT = "https://api.plori.ai/mcp";

const pkgPath = require.resolve("mcp-remote/package.json");
const pkg = require(pkgPath);
const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin["mcp-remote"];
const bin = path.join(path.dirname(pkgPath), binRel);

const args = [bin, ENDPOINT];
if (process.env.PLORI_API_KEY) {
  args.push("--header", `Authorization: Bearer ${process.env.PLORI_API_KEY}`);
}
args.push(...process.argv.slice(2));

const child = spawn(process.execPath, args, {
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
