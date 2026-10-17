import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Next.js's standard build output; Vercel handles deployment packaging.
  // Keep production type-checking enabled so real errors fail the build.
  reactStrictMode: false,
};

export default nextConfig;
