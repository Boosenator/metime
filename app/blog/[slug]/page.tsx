import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
import { getPostOgImage } from "@/lib/blog/og-image"
import { readServicesSync } from "@/lib/services/storage"
import type { TopicBlock } from "@/lib/blog/types"
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  SITE_NAME,
} from "@/lib/seo"
import type { FaqItem } from "@/lib/services/types"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Весілля", dance: "Танець", kids: "Діти", brand: "Бренд",
  lovestory: "Love Story", portrait: "Портрет", custom: "Різне",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const posts = await readBlogPosts()
  const post = posts.find((p) => p.slug === slug && p.published)
  if (!post) return {}

  const ogImage = await getPostOgImage(post.category)

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: `${post.title} | ${SITE_NAME}`,
      description: post.description,
      url: absoluteUrl(`/blog/${slug}`),
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: ogImage, width: 1920, height: 1280, alt: post.title }],
    },
  }
}

function renderBlock(block: TopicBlock, i: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={i} className="mb-4 mt-12 font-serif text-2xl font-light text-cream md:text-3xl">
          {block.text}
        </h2>
      )
    case "h3":
      return (
        <h3 key={i} className="mb-3 mt-8 text-xs uppercase tracking-[0.25em] text-wine">
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
          {block.items.filter(Boolean).map((item, j) => (
            <li key={j} className="flex items-start gap-4 text-gray-light">
              <span className="mt-[0.6em] h-px w-5 shrink-0 bg-wine" />
              {item}
            </li>
          ))}
        </ul>
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
                <span className="font-serif text-lg font-light text-cream">{item.q}</span>
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
          {block.title && (
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-wine">{block.title}</p>
          )}
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const posts = await readBlogPosts()
  const post = posts.find((p) => p.slug === slug && p.published)
  if (!post) notFound()
  const services = readServicesSync()

  const faqItems = post.blocks
    .filter((b): b is { type: "faq"; items: FaqItem[] } => b.type === "faq")
    .flatMap((b) => b.items)

  const related = posts
    .filter((p) => p.published && p.id !== post.id && p.category === post.category)
    .slice(0, 2)

  return (
    <I18nProvider>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildArticleJsonLd({
              title: post.title,
              description: post.description,
              publishedAt: post.publishedAt,
              slug: post.slug,
              serviceSlug: "blog",
            }),
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: "Блог", url: "/blog" },
              { name: post.title, url: `/blog/${slug}` },
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
              <li><a href="/" className="transition-colors hover:text-cream">Головна</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li><a href="/blog" className="transition-colors hover:text-cream">Блог</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{post.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="page-hero">
            <p className="page-eyebrow">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </p>
            <h1 className="mb-5 font-serif text-4xl font-light leading-tight text-cream md:text-5xl">
              {post.title}
            </h1>
            <p className="mb-4 text-lg leading-relaxed text-gray-light">
              {post.description}
            </p>
            <p className="text-xs text-gray-mid">
              {new Date(post.publishedAt).toLocaleDateString("uk-UA", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </header>

          {/* Content */}
          <div>{post.blocks.map((block, i) => renderBlock(block, i))}</div>

          {/* CTA */}
          <div className="cta-panel">
            <p className="mb-6 font-serif text-2xl font-light text-cream">
              Маєте питання про зйомку?
            </p>
            <a
              href="/#contact"
              className="outline-cta"
            >
              Написати нам
            </a>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16">
              <p className="mb-6 text-xs uppercase tracking-[0.3em] text-wine">Читати також</p>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map((rel) => (
                  <a
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="group border border-white/10 p-6 transition-colors hover:border-wine/40"
                  >
                    <h3 className="mb-2 font-serif text-lg font-light text-cream transition-colors group-hover:text-wine">
                      {rel.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-mid line-clamp-2">
                      {rel.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer services={services} />
    </I18nProvider>
  )
}
