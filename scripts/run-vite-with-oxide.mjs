#!/usr/bin/env node
/**
 * Run Vite after ensuring @tailwindcss/oxide native binding is loadable.
 * Sets NAPI_RS_NATIVE_LIBRARY_PATH to an ASCII cache copy when needed.
 */
import { spawnSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const ensure = join(here, "ensure-tailwind-oxide.mjs");
const require = createRequire(import.meta.url);

const ensured = spawnSync(process.execPath, [ensure, "--print-env", "--quiet"], {
  encoding: "utf8",
});
const env = { ...process.env };
for (const line of (ensured.stdout || "").split("\n")) {
  const m = line.match(/^(NAPI_RS_NATIVE_LIBRARY_PATH)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

function resolveVite() {
  const candidates = [
    join(process.cwd(), "node_modules/vite/bin/vite.js"),
    join(here, "../node_modules/vite/bin/vite.js"),
    join(here, "../artifacts/wayzen/node_modules/vite/bin/vite.js"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  try {
    return require.resolve("vite/bin/vite.js", {
      paths: [process.cwd(), join(here, "..")],
    });
  } catch {
    // last resort: PATH
    try {
      return execSync("npm exec --no -- which vite", {
        encoding: "utf8",
        cwd: process.cwd(),
      }).trim();
    } catch {
      return null;
    }
  }
}

const viteBin = resolveVite();
if (!viteBin) {
  console.error("[run-vite-with-oxide] could not resolve vite binary");
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);
