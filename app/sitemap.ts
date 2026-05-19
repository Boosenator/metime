import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"
import { readServicesSync } from "@/lib/services/storage"
import { readBlogPosts } from "@/lib/blog/storage"

export const revalidate = 3600

function dateStr(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0]
}

const deployDateStr = process.env.VERCEL_GIT_COMMIT_DATE
  ? dateStr(process.env.VERCEL_GIT_COMMIT_DATE)
  : dateStr(new Date())

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await readBlogPosts()
  const publishedPosts = posts.filter((p) => p.published)

  const services = readServicesSync()

  const serviceEntries: MetadataRoute.Sitemap = services.map((s) => ({
    url: absoluteUrl(`/${s.slug}`),
    lastModified: deployDateStr,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const topicEntries: MetadataRoute.Sitemap = services.flatMap((s) =>
    s.topics.map((t) => ({
      url: absoluteUrl(`/${s.slug}/${t.slug}`),
      lastModified: dateStr(t.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  )

  const blogEntries: MetadataRoute.Sitemap = publishedPosts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: dateStr(p.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }))

  return [
    { url: absoluteUrl("/"), lastModified: deployDateStr, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/portfolio"), lastModified: deployDateStr, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/blog"), lastModified: deployDateStr, changeFrequency: "weekly", priority: 0.75 },
    ...serviceEntries,
    ...topicEntries,
    ...blogEntries,
  ]
}
