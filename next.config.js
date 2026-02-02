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
  // Proxy API requests to backend. Use fallback so Route Handlers (app/api/*) are
  // tried first; only requests that don't match a handler are rewritten to the backend.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const rewrite = {
      source: '/api/:path*',
      destination: backendUrl.includes('localhost')
        ? 'http://localhost:3001/api/:path*'
        : `${backendUrl}/api/:path*`,
    };
    return {
      fallback: [rewrite],
    };
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
