import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // TEMPORARY: Disable to debug auth redirect loop
  
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

  // Memory optimization and performance improvements
  experimental: {
    proxyTimeout: 300000, // 5 minutes
    optimizePackageImports: ['lucide-react'],
  },

  // Webpack optimizations to reduce memory usage
  webpack: (config, { isServer }) => {
    // Reduce memory usage by limiting parallel processing
    config.parallelism = 1;
    
    // Optimize memory for production builds
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: process.env.NODE_ENV === 'production',
        runtimeChunk: false,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
    }

    // Reduce file watching overhead
    config.watchOptions = {
      ignored: /node_modules/,
      aggregateTimeout: 600, // Increase debounce time
      poll: false, // Disable polling to save resources
    };

    // Disable source maps in development to save memory
    if (process.env.NODE_ENV === 'development') {
      config.devtool = false;
    }

    return config;
  },
  
  // Proxy /api requests to the backend to bypass HTTPS -> HTTP Mixed Content Block
  async rewrites() {
    const isDev = process.env.NODE_ENV !== 'production';
    const backendUrl = process.env.BACKEND_URL || (isDev ? 'http://localhost:3001' : 'http://54.206.113.217:3001');
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
