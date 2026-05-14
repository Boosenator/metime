export type FaqItem = { q: string; a: string }

export type TopicBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "links"; heading?: string; items: { text: string; href: string }[] }
  | { type: "faq"; items: FaqItem[] }

export type ServiceTopic = {
  slug: string
  title: string
  description: string
  keywords: string[]
  publishedAt: string
  blocks: TopicBlock[]
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
