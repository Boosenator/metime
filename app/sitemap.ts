import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"
import { SERVICES } from "@/lib/services/data"

const deployDate = process.env.VERCEL_GIT_COMMIT_DATE
  ? new Date(process.env.VERCEL_GIT_COMMIT_DATE)
  : new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  const serviceEntries: MetadataRoute.Sitemap = SERVICES.map((s) => ({
    url: absoluteUrl(`/${s.slug}`),
    lastModified: deployDate,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const topicEntries: MetadataRoute.Sitemap = SERVICES.flatMap((s) =>
    s.topics.map((t) => ({
      url: absoluteUrl(`/${s.slug}/${t.slug}`),
      lastModified: new Date(t.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  )

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
    ...serviceEntries,
    ...topicEntries,
  ]
}
