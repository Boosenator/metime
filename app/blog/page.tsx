import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
import { readServicesSync } from "@/lib/services/storage"
import { absoluteUrl, buildBreadcrumbJsonLd, SITE_NAME, OG_IMAGE } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Корисні статті про підготовку до фотосесії, вибір фотографа і зйомки від MeTime Studio — Черкаси.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Блог | ${SITE_NAME}`,
    description: "Поради, гайди і відповіді на часті запитання від MeTime Studio.",
    url: absoluteUrl("/blog"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} блог` }],
  },
}

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Весілля",
  dance: "Танець",
  kids: "Діти",
  brand: "Бренд",
  lovestory: "Love Story",
  portrait: "Портрет",
  custom: "Різне",
}

type ArticleCard = {
  key: string
  href: string
  category: string
  date: string
  title: string
  description: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const allBlogPosts = await readBlogPosts()
  const blogPosts = allBlogPosts.filter((p) => p.published)

  const serviceTopics: ArticleCard[] = readServicesSync().flatMap((s) =>
    s.topics.map((t) => ({
      key: `${s.slug}-${t.slug}`,
      href: `/${s.slug}/${t.slug}`,
      category: s.slug,
      date: t.publishedAt,
      title: t.title,
      description: t.description,
    }))
  )

  const dynamicPosts: ArticleCard[] = blogPosts.map((p) => ({
    key: p.id,
    href: `/blog/${p.slug}`,
    category: p.category,
    date: p.publishedAt,
    title: p.title,
    description: p.description,
  }))

  const all: ArticleCard[] = [...dynamicPosts, ...serviceTopics].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <I18nProvider>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: "Блог", url: "/blog" },
            ])
          ),
        }}
      />
      <Navigation />
      <main className="min-h-screen bg-dark pb-24 pt-28">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center gap-2 text-xs text-gray-mid">
              <li><a href="/" className="transition-colors hover:text-cream">Головна</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">Блог</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-16 border-b border-white/8 pb-12">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-wine">Корисне</p>
            <h1 className="mb-4 font-serif text-5xl font-light text-cream md:text-7xl">
              Блог
            </h1>
            <div className="flex items-end justify-between gap-4">
              <p className="max-w-xl text-gray-light">
                Поради про підготовку до зйомки, відповіді на часті питання і корисні гайди від команди MeTime Studio.
              </p>
              <span className="shrink-0 text-xs text-gray-mid">
                {all.length} {all.length === 1 ? "матеріал" : all.length < 5 ? "матеріали" : "матеріалів"}
              </span>
            </div>
          </div>

          {/* Articles */}
          <div className="grid gap-px bg-white/5 sm:grid-cols-2">
            {all.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="group relative flex flex-col bg-dark p-8 transition-colors duration-300 hover:bg-white/[0.03]"
              >
                {/* Wine left border on hover */}
                <span className="absolute left-0 top-0 h-0 w-px bg-wine transition-all duration-500 group-hover:h-full" />

                <div className="mb-4 flex items-center gap-3">
                  <span className="border border-wine/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-wine">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-gray-mid">{formatDate(item.date)}</span>
                </div>

                <h2 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-2xl">
                  {item.title}
                </h2>

                <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-mid line-clamp-3">
                  {item.description}
                </p>

                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-wine">
                  Читати
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </a>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </I18nProvider>
  )
}
