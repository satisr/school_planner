import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.CAPACITOR_BUILD === "true" ? "export" : undefined,
  images: process.env.CAPACITOR_BUILD === "true" ? { unoptimized: true } : undefined,
};

export default nextConfig;
