import type { Metadata } from "next"
import { readBlogPosts } from "@/lib/blog/storage"
import { AdminBlogList } from "@/components/admin-blog-list"

export const metadata: Metadata = {
  title: "Блог — Адмінка",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
  const posts = await readBlogPosts()
  return <AdminBlogList initialPosts={posts} />
}
