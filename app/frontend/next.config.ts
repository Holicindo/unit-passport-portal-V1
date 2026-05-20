import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    // @ts-ignore
    appIsrStatus: false,
    // @ts-ignore
    buildActivity: false,
  } as any,
  experimental: {
    // @ts-ignore
    allowedDevOrigins: ['127.0.0.1', 'localhost']
  }
};

export default nextConfig;
