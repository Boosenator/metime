import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"

const deployDate = process.env.VERCEL_GIT_COMMIT_DATE
  ? new Date(process.env.VERCEL_GIT_COMMIT_DATE)
  : new Date("2025-04-01")

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: deployDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/portfolio"),
      lastModified: deployDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]
}
