import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.5.137.166"],
  transpilePackages: ["@perawallet/connect"],
};

export default nextConfig;
