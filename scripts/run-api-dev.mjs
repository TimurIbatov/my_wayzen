#!/usr/bin/env node
/**
 * Start Express API with repo-root `.env` already loaded
 * (`node --env-file-if-exists=.env ./scripts/run-api-dev.mjs`).
 * api-server `start` also loads `../../.env`; this covers Cursor shells that
 * only inject secrets into the parent process / root file.
 */
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  PORT: process.env.PORT || "5055",
  NODE_ENV: process.env.NODE_ENV || "development",
};

const child = spawn("npm", ["run", "dev", "-w", "@workspace/api-server"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
