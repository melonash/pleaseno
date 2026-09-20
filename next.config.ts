import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG image and icon read the bundled font at runtime.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/**"],
    "/icon": ["./assets/**"],
  },
};

export default nextConfig;
