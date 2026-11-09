#!/usr/bin/env node
/**
 * Report which Clerk env names are set (yes/no) without printing secrets.
 * Checks process.env and repo-root / artifacts/wayzen .env files.
 *
 * Usage: npm run check:clerk-env
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(rootDir, "artifacts/wayzen");

const NAMES = [
  "VITE_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "VITE_CLERK_PROXY_URL",
  "NEXT_PUBLIC_CLERK_PROXY_URL",
];

function stripValue(raw) {
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  // Strip UTF-8 BOM if someone saved .env from Notepad.
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1);
  return v.trim();
}

function parseEnvFile(filePath) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    out[key] = stripValue(t.slice(eq + 1));
  }
  return out;
}

function looksPublishable(v) {
  return Boolean(v && (v.startsWith("pk_test_") || v.startsWith("pk_live_")));
}

function looksSecret(v) {
  return Boolean(v && (v.startsWith("sk_test_") || v.startsWith("sk_live_")));
}

function decodeFrontendApi(key) {
  try {
    const raw = key.replace(/^pk_(test|live)_/, "");
    const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function usablePublishable(v) {
  if (!looksPublishable(v)) return false;
  const api = decodeFrontendApi(v);
  if (!api || api.includes("example") || api.startsWith("preview-")) return false;
  return true;
}

const fileCandidates = [
  join(rootDir, ".env"),
  join(rootDir, ".env.local"),
  join(rootDir, ".env.development"),
  join(rootDir, ".env.development.local"),
  join(appDir, ".env"),
  join(appDir, ".env.local"),
];

console.log("WayZen Clerk env check (secrets never printed)\n");
console.log("cwd:", process.cwd());
console.log("monorepo root:", rootDir);
console.log("");

console.log("Files:");
for (const f of fileCandidates) {
  const rel = f.startsWith(rootDir) ? f.slice(rootDir.length + 1) : f;
  if (!existsSync(f)) {
    console.log(`  - ${rel}: missing`);
    continue;
  }
  const badName =
    f.endsWith(".env.txt") || f.endsWith(".env.rtf") ? " (wrong extension?)" : "";
  console.log(`  - ${rel}: present${badName}`);
}

// Warn about common mistakes next to root
for (const wrong of [".env.txt", ".env.rtf", "env", ".env "]) {
  const p = join(rootDir, wrong);
  if (existsSync(p)) {
    console.log(`  ! Found ${wrong} — rename to .env (no .txt)`);
  }
}

console.log("\nNames (process / files / usable):");
/** @type {Record<string, string>} */
const fromFiles = {};
for (const f of fileCandidates) {
  Object.assign(fromFiles, parseEnvFile(f));
}

let anyPublishableUsable = false;
let secretSet = false;

for (const name of NAMES) {
  const fromProcess = process.env[name] ? stripValue(process.env[name]) : "";
  const fromFile = fromFiles[name] || "";
  const value = fromProcess || fromFile;
  const inProcess = Boolean(fromProcess);
  const inFile = Boolean(fromFile);
  let usable = "n/a";
  if (name.includes("PUBLISHABLE")) {
    const ok = usablePublishable(value);
    usable = ok ? "yes" : value ? "no (placeholder/invalid)" : "no";
    if (ok) anyPublishableUsable = true;
  } else if (name.includes("SECRET")) {
    const ok = looksSecret(value);
    usable = ok ? "yes" : value ? "no (unexpected prefix)" : "no";
    if (ok) secretSet = true;
  } else if (value) {
    usable = "set";
  } else {
    usable = "no";
  }
  console.log(
    `  ${name}: process=${inProcess ? "yes" : "no"} file=${inFile ? "yes" : "no"} usable=${usable}`,
  );
}

console.log("\nSummary:");
console.log(`  clerkPublishableKeyLoaded: ${anyPublishableUsable}`);
console.log(`  clerkSecretKeyLoaded: ${secretSet}`);
if (!anyPublishableUsable) {
  console.log(`
Next steps:
  1. git pull (need Vite envDir + bridge fix on tip)
  2. Put keys in ${join(rootDir, ".env")}  (filename exactly .env, not .env.txt)
  3. Lines without spaces around =, no need for quotes:
       CLERK_PUBLISHABLE_KEY=pk_test_...
       CLERK_SECRET_KEY=sk_test_...
       VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
  4. Kill Vite/API completely, then:  npm run dev:api   and   npm run dev:web
  5. Re-run:  npm run check:clerk-env
  See docs/clerk-env.md
`);
  process.exitCode = 1;
} else if (!secretSet) {
  console.log(
    "  Publishable key OK, but CLERK_SECRET_KEY missing — API stays guest for history/sync.",
  );
  process.exitCode = 2;
} else {
  console.log("  OK — restart dev:web / dev:api if the UI still shows the missing-key banner.");
}
