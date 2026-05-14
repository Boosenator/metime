import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
import { SERVICES } from "@/lib/services/data"
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
  wedding: "Весілля", dance: "Танець", kids: "Діти", brand: "Бренд",
  lovestory: "Love Story", portrait: "Портрет", custom: "Різне",
}

type ArticleCard = {
  key: string
  href: string
  category: string
  date: string
  title: string
  description: string
}

export default async function BlogPage() {
  const allBlogPosts = await readBlogPosts()
  const blogPosts = allBlogPosts.filter((p) => p.published)

  // Merge service hub topics into the listing
  const serviceTopics: ArticleCard[] = SERVICES.flatMap((s) =>
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
          <div className="mb-16">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-wine">Блог</p>
            <h1 className="font-serif text-5xl font-light text-cream md:text-7xl">
              Корисне
            </h1>
            <p className="mt-4 max-w-xl text-gray-light">
              Поради про підготовку до зйомки, відповіді на часті питання і корисні гайди від команди MeTime Studio.
            </p>
          </div>

          <div className="divide-y divide-white/8">
            {all.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="group block py-8"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-wine">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-gray-mid">
                    {new Date(item.date).toLocaleDateString("uk-UA", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="mb-2 font-serif text-2xl font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-3xl">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-gray-light line-clamp-2">
                  {item.description}
                </p>
                <span className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Читати →
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
