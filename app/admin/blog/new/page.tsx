import type { Metadata } from "next"
import { AdminBlogEditor } from "@/components/admin-blog-editor"

export const metadata: Metadata = {
  title: "Новий пост — Адмінка",
  robots: { index: false, follow: false },
}

export default function NewPostPage() {
  return <AdminBlogEditor post={null} />
}
