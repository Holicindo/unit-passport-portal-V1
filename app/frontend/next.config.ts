import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for AWS Amplify SSR deployment
  output: 'standalone',
  
  // Suppress the turbopack workspace root warning
  turbopack: {
    root: __dirname,
  },

  // Allow images from external sources (backend)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '15.135.91.243',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
