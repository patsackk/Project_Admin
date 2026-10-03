import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB request body, which a single phone
      // photo exceeds — the status form allows several photos at 10MB each.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
