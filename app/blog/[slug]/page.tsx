import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
import { getPostOgImage } from "@/lib/blog/og-image"
import type { TopicBlock } from "@/lib/blog/types"
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  SITE_NAME,
} from "@/lib/seo"

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
              <li><a href="/blog" className="transition-colors hover:text-cream">Блог</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{post.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12 border-b border-white/10 pb-12">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-wine">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </p>
            <h1 className="mb-5 font-serif text-4xl font-light text-cream md:text-5xl">
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
          <div className="mt-16 border border-wine/20 px-8 py-10 text-center">
            <p className="mb-6 font-serif text-2xl font-light text-cream">
              Маєте питання про зйомку?
            </p>
            <a
              href="/#contact"
              className="inline-block border border-wine px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream transition-colors duration-300 hover:bg-wine"
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
      <Footer />
    </I18nProvider>
  )
}
