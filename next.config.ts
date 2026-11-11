import type { NextConfig } from "next";

/**
 * `output: "standalone"` is only needed for self-hosted / sandbox runs
 * (single-file server via `bun run build:local`). On Vercel the platform
 * handles output bundling itself, so we keep the standard build there.
 */
const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
