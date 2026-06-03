import type { NextConfig } from 'next';

const isLocal = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_PROD_API;
const backendUrl = isLocal ? 'http://localhost:3001' : 'http://54.206.113.217:3001';

const nextConfig: NextConfig = {
  // Allow images from external sources (backend)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '54.206.113.217',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
  
  // Proxy /api requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
