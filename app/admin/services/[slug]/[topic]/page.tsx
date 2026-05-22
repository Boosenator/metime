import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTopic } from "@/lib/services/storage"
import { AdminServiceTopicEditor } from "@/components/admin-service-topic-editor"

export const metadata: Metadata = {
  title: "Редагування теми — Адмінка",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminServiceTopicPage({
  params,
}: {
  params: Promise<{ slug: string; topic: string }>
}) {
  const { slug, topic: topicSlug } = await params
  const result = await getTopic(slug, topicSlug)
  if (!result) notFound()
  return <AdminServiceTopicEditor service={result.service} topic={result.topic} />
}
