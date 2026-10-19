#!/usr/bin/env node
/**
 * Make @tailwindcss/oxide load reliably under npm (npm/cli#4828) and under
 * non-ASCII checkout paths by:
 * 1) installing the matching platform package if missing
 * 2) copying the .node into @tailwindcss/oxide/ (local require path)
 * 3) copying it into an ASCII cache and exporting NAPI_RS_NATIVE_LIBRARY_PATH
 *
 * Load checks run in a child process so a native dlopen failure cannot take
 * down the parent (and we never re-require a native addon in-process).
 *
 * --print-env  print NAPI_RS_NATIVE_LIBRARY_PATH=... for wrappers
 * --quiet      less logging
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const printEnv = process.argv.includes("--print-env");
const quiet = process.argv.includes("--quiet");

function log(...args) {
  if (!quiet) console.warn(...args);
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

  if (platform === "linux" && arch === "x64") {
    return musl
      ? {
          pkg: "@tailwindcss/oxide-linux-x64-musl",
          localFile: "tailwindcss-oxide.linux-x64-musl.node",
        }
      : {
          pkg: "@tailwindcss/oxide-linux-x64-gnu",
          localFile: "tailwindcss-oxide.linux-x64-gnu.node",
        };
  }
  if (platform === "linux" && arch === "arm64") {
    return musl
      ? {
          pkg: "@tailwindcss/oxide-linux-arm64-musl",
          localFile: "tailwindcss-oxide.linux-arm64-musl.node",
        }
      : {
          pkg: "@tailwindcss/oxide-linux-arm64-gnu",
          localFile: "tailwindcss-oxide.linux-arm64-gnu.node",
        };
  }
  if (platform === "darwin" && arch === "arm64") {
    return {
      pkg: "@tailwindcss/oxide-darwin-arm64",
      localFile: "tailwindcss-oxide.darwin-arm64.node",
    };
  }
  if (platform === "darwin" && arch === "x64") {
    return {
      pkg: "@tailwindcss/oxide-darwin-x64",
      localFile: "tailwindcss-oxide.darwin-x64.node",
    };
  }
  if (platform === "win32" && arch === "x64") {
    return {
      pkg: "@tailwindcss/oxide-win32-x64-msvc",
      localFile: "tailwindcss-oxide.win32-x64-msvc.node",
    };
  }
  if (platform === "win32" && arch === "arm64") {
    return {
      pkg: "@tailwindcss/oxide-win32-arm64-msvc",
      localFile: "tailwindcss-oxide.win32-arm64-msvc.node",
    };
  }
  return null;
}

/** Probe oxide load in a child — never dlopen native addons in this process. */
function canLoadOxide(envPath) {
  const oxidePath = join(root, "node_modules/@tailwindcss/oxide");
  const env = { ...process.env };
  if (envPath) env.NAPI_RS_NATIVE_LIBRARY_PATH = envPath;
  else delete env.NAPI_RS_NATIVE_LIBRARY_PATH;

  const probe = spawnSync(
    process.execPath,
    ["-e", `require(${JSON.stringify(oxidePath)});`],
    { env, encoding: "utf8" },
  );
  return probe.status === 0;
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
    {
      cwd: root,
      stdio: quiet ? "ignore" : "inherit",
      shell: process.platform === "win32",
    },
  );
}

function stageBinding(binding, version) {
  const oxideDir = join(root, "node_modules/@tailwindcss/oxide");
  const pkgDir = join(root, "node_modules", binding.pkg);
  const source = findNodeFile(pkgDir);
  if (!source) return null;

  const localTarget = join(oxideDir, binding.localFile);
  try {
    copyFileSync(source, localTarget);
  } catch (err) {
    log("[ensure-tailwind-oxide] copy into oxide package failed:", err.message);
  }

  const cache = asciiCachePath(binding.localFile, version);
  try {
    mkdirSync(cache.dir, { recursive: true });
    copyFileSync(source, cache.file);
    return cache.file;
  } catch (err) {
    log("[ensure-tailwind-oxide] ASCII cache copy failed:", err.message);
    return source;
  }
}

function main() {
  const oxideDir = join(root, "node_modules/@tailwindcss/oxide");
  if (!existsSync(oxideDir)) process.exit(0);

  const binding = platformBinding();
  const version = oxideVersion();

  let staged = null;
  if (binding && version) {
    // Prefer staging whenever the platform package exists.
    const pkgDir = join(root, "node_modules", binding.pkg);
    if (!existsSync(pkgDir) || !findNodeFile(pkgDir)) {
      if (!canLoadOxide()) {
        installPlatformPackage(binding.pkg, version);
      }
    }
    if (existsSync(join(root, "node_modules", binding.pkg))) {
      staged = stageBinding(binding, version);
    }
  }

  if (canLoadOxide(staged) || canLoadOxide()) {
    if (printEnv && staged) {
      process.stdout.write(`NAPI_RS_NATIVE_LIBRARY_PATH=${staged}\n`);
    }
    process.exit(0);
  }

  // Last attempt: install + stage + probe.
  if (binding && version) {
    installPlatformPackage(binding.pkg, version);
    staged = stageBinding(binding, version);
  }

  if (canLoadOxide(staged) || canLoadOxide()) {
    log(
      `[ensure-tailwind-oxide] ready (${binding?.pkg}@${version}${staged ? `; cache ${staged}` : ""})`,
    );
    if (printEnv && staged) {
      process.stdout.write(`NAPI_RS_NATIVE_LIBRARY_PATH=${staged}\n`);
    }
    process.exit(0);
  }

  console.error("[ensure-tailwind-oxide] still cannot load @tailwindcss/oxide.");
  console.error(
    "  Recovery: rm -rf node_modules package-lock.json && npm install",
  );
  console.error(
    "  Prefer ASCII checkout: mkdir -p ~/projects && git clone … ~/projects/my_wayzen",
  );
  process.exit(printEnv ? 1 : 0);
}

main();
