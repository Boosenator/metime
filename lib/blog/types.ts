import type { TopicBlock } from "@/lib/services/types"

export type { TopicBlock }

export type BlogLocale = "uk" | "en"

export type BlogPostTranslation = {
  title: string
  description: string
  keywords: string[]
  blocks: TopicBlock[]
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  description: string
  keywords: string[]
  category: string
  blocks: TopicBlock[]
  translations?: Partial<Record<BlogLocale, BlogPostTranslation>>
  published: boolean
  publishedAt: string
  updatedAt: string
}
