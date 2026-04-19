/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "true"

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
}

export default nextConfig
