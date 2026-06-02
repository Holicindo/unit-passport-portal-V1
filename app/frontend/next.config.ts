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
    ],
  },
  
  // Proxy /api requests to the backend to bypass HTTPS -> HTTP Mixed Content Block
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://54.206.113.217:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
