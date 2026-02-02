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


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "agrotalent-hub-org",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
