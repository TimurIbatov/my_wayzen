#!/usr/bin/env node
/**
 * Run @workspace/web with root `.env` already loaded into process.env
 * (via `node --env-file-if-exists=.env`). Usage:
 *   node --env-file-if-exists=.env ./scripts/run-web-next.mjs [dev|build|start]
 */
import { spawn } from "node:child_process";

const script = process.argv[2] || "dev";
const allowed = new Set(["dev", "build", "start", "typecheck"]);
if (!allowed.has(script)) {
  console.error(`Unknown web script: ${script}`);
  process.exit(1);
}

const env = { ...process.env };
if (script === "dev" || script === "start") {
  env.PORT = process.env.PORT || "3000";
}
// Next build requires NODE_ENV=production (root .env often has development).
if (script === "build") {
  env.NODE_ENV = "production";
}

const child = spawn("npm", ["run", script, "-w", "@workspace/web"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
