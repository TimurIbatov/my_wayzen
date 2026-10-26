#!/usr/bin/env node
/**
 * Start Vite SPA with repo-root `.env` already loaded
 * (`node --env-file-if-exists=.env ./scripts/run-web-vite.mjs`).
 *
 * Important: root `.env` often sets `PORT=5055` for the API. That must NOT
 * bind the Vite dev server — force SPA port unless `VITE_DEV_PORT` is set.
 */
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  // Prefer explicit Vite port; never inherit API PORT=5055 from root .env.
  PORT: process.env.VITE_DEV_PORT || "5173",
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
