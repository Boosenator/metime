import type { TopicBlock } from "@/lib/services/types"

export type { TopicBlock }

export type BlogPost = {
  id: string
  slug: string
  title: string
  description: string
  keywords: string[]
  category: string
  blocks: TopicBlock[]
  published: boolean
  publishedAt: string
  updatedAt: string
}
