/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    // Baseline CSP: blocks framing/plugins/base-uri tampering while allowing
    // any https: source for scripts/media/connect so Google Tag Manager
    // (container GTM-N8RD2TDH) can keep loading its configured tags without
    // this needing to enumerate every third-party domain by hand. Tighten to
    // a nonce-based script-src once GTM's tag list is audited.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src https:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
]

const nextConfig = {
  ...(isStatic && {
    output: "export",
    assetPrefix: "./",
    trailingSlash: true,
  }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: isStatic,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pvkfjwkaaidqblea.public.blob.vercel-storage.com",
      },
    ],
  },
  ...(!isStatic && {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
        {
          source: "/images/:path*",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
      ]
    },
  }),
}

export default nextConfig
