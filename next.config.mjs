/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
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
    unoptimized: true,
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
