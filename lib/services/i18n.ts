import type { ServiceTopic, TopicBlock } from "@/lib/services/types"

export type ContentLocale = "uk" | "en"

export type LocalizedTopic = {
  title: string
  description: string
  keywords: string[]
  blocks: TopicBlock[]
}

export function getLocalizedTopic(topic: ServiceTopic, locale: ContentLocale): LocalizedTopic {
  const translation = topic.translations?.[locale]

  if (!translation) {
    return {
      title: topic.title,
      description: topic.description,
      keywords: topic.keywords,
      blocks: topic.blocks,
    }
  }

  return {
    title: translation.title || topic.title,
    description: translation.description || topic.description,
    keywords: translation.keywords?.length ? translation.keywords : topic.keywords,
    blocks: translation.blocks?.length ? translation.blocks : topic.blocks,
  }
}

export function normalizeContentLocale(value: string | undefined): ContentLocale {
  return value === "en" ? "en" : "uk"
}
