import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/db", "@workspace/api-zod"],
  serverExternalPackages: ["pg", "drizzle-orm"],
  // Monorepo: include workspace packages in serverless traces.
  outputFileTracingRoot: rootDir,
};

export default nextConfig;
