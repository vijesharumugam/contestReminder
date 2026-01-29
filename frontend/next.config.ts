import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile lucide-react to fix HMR issues with Turbopack
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
