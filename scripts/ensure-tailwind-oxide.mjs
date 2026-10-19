#!/usr/bin/env node
/**
 * Make @tailwindcss/oxide load reliably under npm (npm/cli#4828) and under
 * non-ASCII checkout paths by:
 * 1) installing the matching platform package if missing
 * 2) copying the .node into @tailwindcss/oxide/ (local require path)
 * 3) copying it into an ASCII cache and exporting NAPI_RS_NATIVE_LIBRARY_PATH
 *
 * When run with --print-env, prints `export NAPI_RS_NATIVE_LIBRARY_PATH=...`
 * for shell wrappers.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const printEnv = process.argv.includes("--print-env");
const quiet = process.argv.includes("--quiet");

function log(...args) {
  if (!quiet || printEnv) console.warn(...args);
}

function oxideVersion() {
  try {
    return require(join(root, "node_modules/@tailwindcss/oxide/package.json"))
      .version;
  } catch {
    return null;
  }
}

function isMusl() {
  try {
    return require("node:fs")
      .readFileSync("/usr/bin/ldd", "utf8")
      .includes("musl");
  } catch {
    return false;
  }
}

/** @returns {{ pkg: string, localFile: string } | null} */
function platformBinding() {
  const { platform, arch } = process;
  const musl = platform === "linux" && isMusl();

  const map = {
    "linux-x64-gnu": {
      pkg: "@tailwindcss/oxide-linux-x64-gnu",
      localFile: "tailwindcss-oxide.linux-x64-gnu.node",
    },
    "linux-x64-musl": {
      pkg: "@tailwindcss/oxide-linux-x64-musl",
      localFile: "tailwindcss-oxide.linux-x64-musl.node",
    },
    "linux-arm64-gnu": {
      pkg: "@tailwindcss/oxide-linux-arm64-gnu",
      localFile: "tailwindcss-oxide.linux-arm64-gnu.node",
    },
    "linux-arm64-musl": {
      pkg: "@tailwindcss/oxide-linux-arm64-musl",
      localFile: "tailwindcss-oxide.linux-arm64-musl.node",
    },
    "darwin-arm64": {
      pkg: "@tailwindcss/oxide-darwin-arm64",
      localFile: "tailwindcss-oxide.darwin-arm64.node",
    },
    "darwin-x64": {
      pkg: "@tailwindcss/oxide-darwin-x64",
      localFile: "tailwindcss-oxide.darwin-x64.node",
    },
    "win32-x64": {
      pkg: "@tailwindcss/oxide-win32-x64-msvc",
      localFile: "tailwindcss-oxide.win32-x64-msvc.node",
    },
    "win32-arm64": {
      pkg: "@tailwindcss/oxide-win32-arm64-msvc",
      localFile: "tailwindcss-oxide.win32-arm64-msvc.node",
    },
  };

  if (platform === "linux" && arch === "x64") {
    return musl ? map["linux-x64-musl"] : map["linux-x64-gnu"];
  }
  if (platform === "linux" && arch === "arm64") {
    return musl ? map["linux-arm64-musl"] : map["linux-arm64-gnu"];
  }
  if (platform === "darwin" && arch === "arm64") return map["darwin-arm64"];
  if (platform === "darwin" && arch === "x64") return map["darwin-x64"];
  if (platform === "win32" && arch === "x64") return map["win32-x64"];
  if (platform === "win32" && arch === "arm64") return map["win32-arm64"];
  return null;
}

function canLoadOxide() {
  try {
    // Clear require cache so copies take effect in this process.
    const id = require.resolve(join(root, "node_modules/@tailwindcss/oxide"));
    delete require.cache[id];
    require(join(root, "node_modules/@tailwindcss/oxide"));
    return true;
  } catch {
    return false;
  }
}

function findNodeFile(dir) {
  if (!existsSync(dir)) return null;
  const hit = readdirSync(dir).find((name) => name.endsWith(".node"));
  return hit ? join(dir, hit) : null;
}

function asciiCachePath(localFile, version) {
  const base =
    process.env.WAYZEN_OXIDE_CACHE ||
    join(homedir() || tmpdir(), ".cache", "wayzen-oxide", version || "unknown");
  // Force ASCII-only path components.
  const safe = base.replace(/[^\x20-\x7E]/g, "_");
  return { dir: safe, file: join(safe, localFile) };
}

function installPlatformPackage(pkg, version) {
  log(
    `[ensure-tailwind-oxide] installing ${pkg}@${version} (npm/cli#4828 workaround)`,
  );
  return spawnSync(
    "npm",
    [
      "install",
      `${pkg}@${version}`,
      "--no-save",
      "--no-package-lock",
      "--legacy-peer-deps",
      "--no-fund",
      "--no-audit",
      "--force",
    ],
    { cwd: root, stdio: quiet ? "ignore" : "inherit", shell: process.platform === "win32" },
  );
}

function stageBinding(binding, version) {
  const oxideDir = join(root, "node_modules/@tailwindcss/oxide");
  const pkgDir = join(root, "node_modules", binding.pkg);
  let source = findNodeFile(pkgDir);
  if (!source) {
    // Sometimes nested under .pnpm-like layouts or workspace hoists differently.
    source = findNodeFile(join(root, "node_modules/@tailwindcss", binding.pkg.replace("@tailwindcss/", "")));
  }
  if (!source || !existsSync(source)) {
    return null;
  }

  // 1) Local file next to oxide index.js (first require attempt in napi loader).
  const localTarget = join(oxideDir, binding.localFile);
  try {
    copyFileSync(source, localTarget);
  } catch (err) {
    log("[ensure-tailwind-oxide] copy into oxide package failed:", err.message);
  }

  // 2) ASCII cache for NAPI_RS_NATIVE_LIBRARY_PATH (helps non-ASCII checkouts).
  const cache = asciiCachePath(binding.localFile, version);
  try {
    mkdirSync(cache.dir, { recursive: true });
    copyFileSync(source, cache.file);
    process.env.NAPI_RS_NATIVE_LIBRARY_PATH = cache.file;
    return cache.file;
  } catch (err) {
    log("[ensure-tailwind-oxide] ASCII cache copy failed:", err.message);
    // Fall back to source path.
    process.env.NAPI_RS_NATIVE_LIBRARY_PATH = source;
    return source;
  }
}

function main() {
  const oxideDir = join(root, "node_modules/@tailwindcss/oxide");
  if (!existsSync(oxideDir)) {
    if (printEnv) process.exit(0);
    process.exit(0);
  }

  const binding = platformBinding();
  const version = oxideVersion();

  if (canLoadOxide()) {
    // Still stage ASCII path for future child processes / non-ASCII cwd.
    if (binding && version) {
      const staged = stageBinding(binding, version);
      if (printEnv && staged) {
        // Print for eval by shell wrappers.
        process.stdout.write(`NAPI_RS_NATIVE_LIBRARY_PATH=${staged}\n`);
      }
    }
    process.exit(0);
  }

  if (!binding || !version) {
    console.error(
      "[ensure-tailwind-oxide] @tailwindcss/oxide native binding missing; platform unsupported/unknown.",
    );
    console.error(
      "  Recovery: rm -rf node_modules package-lock.json && npm install",
    );
    console.error("  Prefer ASCII path: ~/projects/my_wayzen");
    process.exit(printEnv ? 1 : 0);
  }

  const pkgDir = join(root, "node_modules", binding.pkg);
  if (!existsSync(pkgDir) || !findNodeFile(pkgDir)) {
    const result = installPlatformPackage(binding.pkg, version);
    if (result.status !== 0) {
      console.error(
        `[ensure-tailwind-oxide] failed to install ${binding.pkg}@${version}`,
      );
    }
  }

  const staged = stageBinding(binding, version);

  // Clear oxide from cache and retry with env set.
  if (staged) {
    process.env.NAPI_RS_NATIVE_LIBRARY_PATH = staged;
  }

  if (!canLoadOxide()) {
    console.error("[ensure-tailwind-oxide] still cannot load @tailwindcss/oxide.");
    console.error(
      "  Recovery: rm -rf node_modules package-lock.json && npm install",
    );
    console.error(
      "  If the path has non-ASCII characters (e.g. Рабочий стол), clone to ~/projects/my_wayzen",
    );
    process.exit(printEnv ? 1 : 0);
  }

  log(`[ensure-tailwind-oxide] ready (${binding.pkg}@${version})`);
  if (printEnv && staged) {
    process.stdout.write(`NAPI_RS_NATIVE_LIBRARY_PATH=${staged}\n`);
  }
}

main();
