import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ['127.0.0.1', 'localhost']
  }
};

export default nextConfig;
