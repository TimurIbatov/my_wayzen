#!/usr/bin/env node
/** Build @workspace/wayzen with Vite PORT/BASE_PATH defaults for local/CI. */
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  PORT: process.env.PORT || "5173",
  BASE_PATH: process.env.BASE_PATH || "/",
};

const result = spawnSync(
  "npm",
  ["run", "build", "-w", "@workspace/wayzen", "--if-present"],
  { stdio: "inherit", env, shell: process.platform === "win32" },
);

process.exit(result.status ?? 1);
