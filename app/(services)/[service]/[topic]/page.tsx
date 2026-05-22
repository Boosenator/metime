import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readServicesSync, readServices, getTopic } from "@/lib/services/storage"
import { getLocalizedTopic, normalizeContentLocale } from "@/lib/services/i18n"
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

const SERVICE_NAMES_EN: Record<string, string> = {
  wedding: "Wedding shoots",
  dance: "Dance shoots",
  kids: "Kids shoots",
  brand: "Brand shoots",
}

const TOPIC_COPY = {
  uk: {
    home: "Головна",
    faq: "Часті запитання",
    ctaTitle: "Готові обговорити вашу зйомку?",
    cta: "Зв'язатись з нами",
  },
  en: {
    home: "Home",
    faq: "FAQ",
    ctaTitle: "Ready to discuss your shoot?",
    cta: "Contact us",
  },
}

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
  const result = await getTopic(serviceSlug, topicSlug)
  if (!result) return {}

  const { service, topic } = result
  const locale = normalizeContentLocale((await cookies()).get("metime-locale")?.value)
  const localized = getLocalizedTopic(topic, locale)
  return {
    title: localized.title,
    description: localized.description,
    keywords: localized.keywords,
    alternates: { canonical: `/${serviceSlug}/${topicSlug}` },
    openGraph: {
      title: `${localized.title} | ${SITE_NAME}`,
      description: localized.description,
      url: absoluteUrl(`/${serviceSlug}/${topicSlug}`),
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: localized.title }],
      type: "article",
    },
  }
}

function renderBlock(block: TopicBlock, i: number, locale: "uk" | "en") {
  const copy = TOPIC_COPY[locale]

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
            {copy.faq}
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
    case "carousel":
      if (!block.photos.length) return null
      return (
        <div key={i} className="my-10 -mx-6 overflow-x-auto lg:-mx-8">
          <div className="flex gap-3 px-6 pb-2 lg:px-8" style={{ width: "max-content" }}>
            {block.photos.map((photo, j) => (
              <div key={j} className="h-72 w-52 shrink-0 overflow-hidden">
                <img
                  src={photo.src}
                  alt={photo.alt || "MeTime Studio"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )
    case "video":
      if (!block.src) return null
      return (
        <div key={i} className="my-10">
          <video
            src={block.src}
            poster={block.poster}
            controls
            playsInline
            preload="metadata"
            className="w-full"
          />
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
  const result = await getTopic(serviceSlug, topicSlug)
  if (!result) notFound()

  const { service, topic } = result
  const locale = normalizeContentLocale((await cookies()).get("metime-locale")?.value)
  const localized = getLocalizedTopic(topic, locale)
  const copy = TOPIC_COPY[locale]
  const serviceName = locale === "en" ? SERVICE_NAMES_EN[serviceSlug] ?? service.name : service.name
  const services = await readServices()

  const faqItems = localized.blocks
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
              title: localized.title,
              description: localized.description,
              publishedAt: topic.publishedAt,
              slug: topicSlug,
              serviceSlug,
            }),
            buildBreadcrumbJsonLd([
              { name: copy.home, url: "/" },
              { name: serviceName, url: `/${serviceSlug}` },
              { name: localized.title, url: `/${serviceSlug}/${topicSlug}` },
            ]),
            ...(faqItems.length > 0 ? [buildFaqJsonLd(faqItems)] : []),
          ]),
        }}
      />
      <Navigation />
      <main className="page-main">
        <article className="article-container">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="breadcrumb-nav">
            <ol className="breadcrumb-list">
              <li><a href="/" className="transition-colors hover:text-cream">{copy.home}</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li><a href={`/${serviceSlug}`} className="transition-colors hover:text-cream">{serviceName}</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{localized.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="page-hero">
            <p className="page-eyebrow">
              {serviceName}
            </p>
            <h1 className="mb-5 font-serif text-4xl font-light leading-tight text-cream md:text-5xl">
              {localized.title}
            </h1>
            <p className="text-lg leading-relaxed text-gray-light">
              {localized.description}
            </p>
          </header>

          {/* Content */}
          <div>{localized.blocks.map((block, i) => renderBlock(block, i, locale))}</div>

          {/* CTA */}
          <div className="cta-panel">
            <p className="mb-6 font-serif text-2xl font-light text-cream">
              {copy.ctaTitle}
            </p>
            <a
              href="/#contact"
              className="outline-cta"
            >
              {copy.cta}
            </a>
          </div>

        </article>
      </main>
      <Footer services={services} />
    </I18nProvider>
  )
}
