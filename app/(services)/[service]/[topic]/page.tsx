import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readServicesSync, getTopicSync as getTopic } from "@/lib/services/storage"
import type { TopicBlock } from "@/lib/services/types"
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  SITE_NAME,
  OG_IMAGE,
} from "@/lib/seo"
import type { FaqItem } from "@/lib/services/types"

export function generateStaticParams() {
  return readServicesSync().flatMap((s) =>
    s.topics.map((t) => ({ service: s.slug, topic: t.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; topic: string }>
}): Promise<Metadata> {
  const { service: serviceSlug, topic: topicSlug } = await params
  const result = getTopic(serviceSlug, topicSlug)
  if (!result) return {}

  const { service, topic } = result
  return {
    title: topic.title,
    description: topic.description,
    keywords: topic.keywords,
    alternates: { canonical: `/${serviceSlug}/${topicSlug}` },
    openGraph: {
      title: `${topic.title} | ${SITE_NAME}`,
      description: topic.description,
      url: absoluteUrl(`/${serviceSlug}/${topicSlug}`),
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: topic.title }],
      type: "article",
    },
  }
}

function renderBlock(block: TopicBlock, i: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={i}
          className="mb-4 mt-12 font-serif text-2xl font-light text-cream md:text-3xl"
        >
          {block.text}
        </h2>
      )
    case "h3":
      return (
        <h3
          key={i}
          className="mb-3 mt-8 text-xs uppercase tracking-[0.25em] text-wine"
        >
          {block.text}
        </h3>
      )
    case "p":
      return (
        <p key={i} className="mb-6 leading-[1.85] text-gray-light">
          {block.text}
        </p>
      )
    case "ul":
      return (
        <ul key={i} className="mb-8 space-y-3">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-4 text-gray-light">
              <span className="mt-[0.6em] h-px w-5 shrink-0 bg-wine" />
              {item}
            </li>
          ))}
        </ul>
      )
    case "links":
      return (
        <div key={i} className="my-10 border border-wine/20 p-6">
          {block.heading && (
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-wine">
              {block.heading}
            </p>
          )}
          <ul className="space-y-2">
            {block.items.map((item, j) => (
              <li key={j}>
                <a
                  href={item.href}
                  className="text-sm text-cream underline underline-offset-4 transition-colors hover:text-wine"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )
    case "faq":
      return (
        <div key={i} className="my-10 space-y-3">
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-wine">
            Часті запитання
          </p>
          {block.items.map((item, j) => (
            <details
              key={j}
              className="group border border-white/10 transition-colors open:border-wine/30"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5">
                <span className="font-serif text-lg font-light text-cream">
                  {item.q}
                </span>
                <span className="mt-1 shrink-0 text-xl leading-none text-wine transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="border-t border-white/8 px-6 py-5 leading-relaxed text-gray-light">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ service: string; topic: string }>
}) {
  const { service: serviceSlug, topic: topicSlug } = await params
  const result = getTopic(serviceSlug, topicSlug)
  if (!result) notFound()

  const { service, topic } = result

  const faqItems = topic.blocks
    .filter((b): b is { type: "faq"; items: FaqItem[] } => b.type === "faq")
    .flatMap((b) => b.items)

  return (
    <I18nProvider>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildArticleJsonLd({
              title: topic.title,
              description: topic.description,
              publishedAt: topic.publishedAt,
              slug: topicSlug,
              serviceSlug,
            }),
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: service.name, url: `/${serviceSlug}` },
              { name: topic.title, url: `/${serviceSlug}/${topicSlug}` },
            ]),
            ...(faqItems.length > 0 ? [buildFaqJsonLd(faqItems)] : []),
          ]),
        }}
      />
      <Navigation />
      <main className="min-h-screen bg-dark pb-24 pt-28">
        <article className="mx-auto max-w-3xl px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-12">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-mid">
              <li><a href="/" className="transition-colors hover:text-cream">Головна</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li><a href={`/${serviceSlug}`} className="transition-colors hover:text-cream">{service.name}</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{topic.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12 border-b border-white/10 pb-12">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-wine">
              {service.name}
            </p>
            <h1 className="mb-5 font-serif text-4xl font-light text-cream md:text-5xl">
              {topic.title}
            </h1>
            <p className="text-lg leading-relaxed text-gray-light">
              {topic.description}
            </p>
          </header>

          {/* Content */}
          <div>{topic.blocks.map((block, i) => renderBlock(block, i))}</div>

          {/* CTA */}
          <div className="mt-16 border border-wine/20 px-8 py-10 text-center">
            <p className="mb-6 font-serif text-2xl font-light text-cream">
              Готові обговорити вашу зйомку?
            </p>
            <a
              href="/#contact"
              className="inline-block border border-wine px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream transition-colors duration-300 hover:bg-wine"
            >
              Зв&apos;язатись з нами
            </a>
          </div>

        </article>
      </main>
      <Footer />
    </I18nProvider>
  )
}
