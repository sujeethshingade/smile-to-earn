import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        "node:crypto": false,
        "node:stream": false,
        "node:util": false,
        "node:url": false,
        "node:https": false,
        "node:http": false,
        "node:path": false,
        "node:os": false,
      };
    }
    return config;
  },
};

export default nextConfig;
