import type { NextConfig } from 'next';

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
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
    ],
  },

  // Increase proxy timeout for bulk operations (default 30s is too short)
  experimental: {
    proxyTimeout: 300000, // 5 minutes
  },
  
  // Proxy /api requests to the backend to bypass HTTPS -> HTTP Mixed Content Block
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const backendUrl = process.env.BACKEND_URL || 'http://54.206.113.217:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
