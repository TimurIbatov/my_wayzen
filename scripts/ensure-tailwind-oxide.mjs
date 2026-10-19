#!/usr/bin/env node
/**
 * npm optionalDependencies bug (npm/cli#4828) can leave @tailwindcss/oxide
 * without its platform native binding after install. Reinstall the matching
 * optional package when require() fails.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function oxideVersion() {
  try {
    return require(join(root, "node_modules/@tailwindcss/oxide/package.json")).version;
  } catch {
    return null;
  }
}

function platformPackage() {
  const { platform, arch } = process;
  const musl =
    platform === "linux" &&
    (() => {
      try {
        return require("node:fs")
          .readFileSync("/usr/bin/ldd", "utf8")
          .includes("musl");
      } catch {
        return false;
      }
    })();

  if (platform === "linux" && arch === "x64") {
    return musl
      ? "@tailwindcss/oxide-linux-x64-musl"
      : "@tailwindcss/oxide-linux-x64-gnu";
  }
  if (platform === "linux" && arch === "arm64") {
    return musl
      ? "@tailwindcss/oxide-linux-arm64-musl"
      : "@tailwindcss/oxide-linux-arm64-gnu";
  }
  if (platform === "darwin" && arch === "arm64") return "@tailwindcss/oxide-darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "@tailwindcss/oxide-darwin-x64";
  if (platform === "win32" && arch === "x64") return "@tailwindcss/oxide-win32-x64-msvc";
  if (platform === "win32" && arch === "arm64") return "@tailwindcss/oxide-win32-arm64-msvc";
  return null;
}

function canLoadOxide() {
  try {
    require(join(root, "node_modules/@tailwindcss/oxide"));
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(join(root, "node_modules/@tailwindcss/oxide"))) {
  // Install graph may not include Tailwind in this workspace slice.
  process.exit(0);
}

if (canLoadOxide()) {
  process.exit(0);
}

const version = oxideVersion();
const pkg = platformPackage();
if (!version || !pkg) {
  console.warn(
    "[ensure-tailwind-oxide] @tailwindcss/oxide native binding missing and platform is unsupported/unknown.",
  );
  console.warn(
    "  Recovery: rm -rf node_modules package-lock.json && npm install",
  );
  process.exit(0);
}

console.warn(
  `[ensure-tailwind-oxide] native binding missing; installing ${pkg}@${version} (npm/cli#4828 workaround)`,
);
const result = spawnSync(
  "npm",
  [
    "install",
    `${pkg}@${version}`,
    "--no-save",
    "--no-package-lock",
    "--legacy-peer-deps",
    "--no-fund",
    "--no-audit",
  ],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if (result.status !== 0 || !canLoadOxide()) {
  console.error("[ensure-tailwind-oxide] still cannot load @tailwindcss/oxide.");
  console.error(
    "  Recovery: rm -rf node_modules package-lock.json && npm install",
  );
  process.exit(0);
}

console.log(`[ensure-tailwind-oxide] installed ${pkg}@${version}`);
