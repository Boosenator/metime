import type { Metadata } from "next"
import { readBlogPosts } from "@/lib/blog/storage"
import { SERVICES } from "@/lib/services/data"
import { AdminBlogList } from "@/components/admin-blog-list"

export const metadata: Metadata = {
  title: "Блог — Адмінка",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
  const posts = await readBlogPosts()

  const staticTopics = SERVICES.flatMap((s) =>
    s.topics.map((t) => ({
      id: `${s.slug}__${t.slug}`,
      serviceSlug: s.slug,
      serviceName: s.name,
      slug: t.slug,
      title: t.title,
      description: t.description,
      publishedAt: t.publishedAt,
      href: `/${s.slug}/${t.slug}`,
    }))
  )

  return <AdminBlogList initialPosts={posts} staticTopics={staticTopics} />
}
