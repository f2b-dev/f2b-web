import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@f2b/spec",
    "@f2b/ui",
    "@f2b/bff-core",
    "@f2b/console-shell",
    "@f2b/plugin-sandbox",
  ],
};

export default nextConfig;
