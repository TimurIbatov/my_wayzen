#!/usr/bin/env node
/**
 * Start Vite SPA with repo-root `.env` already loaded
 * (`node --env-file-if-exists=.env ./scripts/run-web-vite.mjs`).
 */
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  PORT: process.env.PORT || "5173",
  BASE_PATH: process.env.BASE_PATH || "/",
};

const child = spawn("npm", ["run", "dev", "-w", "@workspace/wayzen"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
