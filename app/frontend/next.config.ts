import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  
  // Proxy /api requests to the backend to bypass HTTPS -> HTTP Mixed Content Block
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://15.135.91.243:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
