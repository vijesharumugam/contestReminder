import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile lucide-react to fix HMR issues with Turbopack
  transpilePackages: ["lucide-react"],
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
  ],
};

export default nextConfig;
