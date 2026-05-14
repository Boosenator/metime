import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { readBlogPosts } from "@/lib/blog/storage"
import { AdminBlogEditor } from "@/components/admin-blog-editor"

export const metadata: Metadata = {
  title: "Редагування посту — Адмінка",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const posts = await readBlogPosts()
  const post = posts.find((p) => p.id === id)
  if (!post) notFound()
  return <AdminBlogEditor post={post} />
}
