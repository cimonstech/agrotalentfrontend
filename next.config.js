/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['gsap'],
  // Slightly smaller HTML (remove X-Powered-By header)
  poweredByHeader: false,
  // Avoid noisy 404s for missing *.map files in devtools.
  // (Disables client-side source maps in dev builds)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  // Disable instrumentation to prevent Windows permission issues with trace file
  experimental: {
    instrumentationHook: false,
    // Smaller dev bundles / faster compiles for heavy libraries
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  // Windows-specific optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Do not set config.devtool = false here: Next.js overrides it and logs
      // "improper-devtool", which can contribute to inconsistent dev chunks.

      // File watching: polling is reliable on Windows but costs CPU. Opt out with NEXT_DISABLE_WATCH_POLL=1 if native watching works for you.
      config.watchOptions =
        process.env.NEXT_DISABLE_WATCH_POLL === '1'
          ? {
              aggregateTimeout: 300,
              ignored: ['**/node_modules', '**/.git', '**/.next'],
            }
          : {
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
  // Higher values reduce 404s when chunks are evicted before the client fetches them
  ...(process.platform === 'win32' && {
    onDemandEntries: {
      // Keep compiled routes in memory longer to avoid repeated 30–120s recompiles in dev
      maxInactiveAge: 5 * 60 * 1000,
      pagesBufferLength: 25,
    },
  }),
}

module.exports = nextConfig


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

const isProd = process.env.NODE_ENV === 'production'

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "agrotalent-hub-org",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Dev: skip Sentry webpack injection (much faster `next dev` compiles). Prod: full setup.
  disableSentryConfig: !isProd,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: isProd,

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
    automaticVercelMonitors: isProd,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
