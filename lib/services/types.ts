export type FaqItem = { q: string; a: string }

export type CarouselPhoto = { src: string; alt: string }

export type TopicBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "links"; heading?: string; items: { text: string; href: string }[] }
  | { type: "faq"; items: FaqItem[] }
  | { type: "carousel"; photos: CarouselPhoto[] }
  | { type: "video"; src: string; poster?: string; title?: string }

export type ServiceTopic = {
  slug: string
  title: string
  description: string
  keywords: string[]
  publishedAt: string
  blocks: TopicBlock[]
  translations?: {
    en?: {
      title: string
      description: string
      keywords: string[]
      blocks?: TopicBlock[]
    }
  }
}

export type ServiceData = {
  slug: string
  name: string
  title: string
  description: string
  keywords: string[]
  intro: string
  topics: ServiceTopic[]
}
