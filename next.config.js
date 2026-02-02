/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Slightly smaller HTML (remove X-Powered-By header)
  poweredByHeader: false,
  // Avoid noisy 404s for missing *.map files in devtools.
  // (Disables client-side source maps in dev builds)
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Disable instrumentation to prevent Windows permission issues with trace file
  experimental: {
    instrumentationHook: false,
  },
  // Proxy API requests to backend
  // Note: Route handlers in app/api take precedence over rewrites
  // In production, NEXT_PUBLIC_API_URL should be set to your backend URL
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Only add rewrite if backend URL is provided and not localhost (production)
    if (backendUrl && !backendUrl.includes('localhost')) {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ];
    }
    // In development, Next.js will proxy to localhost:3001
    // Route handlers in app/api will take precedence
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  // Windows-specific optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable client sourcemaps in dev to avoid repeated *.map 404s
      if (!isServer) {
        config.devtool = false
      }

      // Better file watching for Windows
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
      
      // Reduce worker processes on Windows to avoid EPERM errors
      if (process.platform === 'win32') {
        config.optimization = {
          ...config.optimization,
          minimize: false,
        }
      }
    }
    return config
  },
  // Improve chunk loading reliability (Windows-specific)
  ...(process.platform === 'win32' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
}

module.exports = nextConfig
