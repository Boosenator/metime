import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
import { readServicesSync } from "@/lib/services/storage"
import { getLocalizedTopic, normalizeContentLocale } from "@/lib/services/i18n"
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

const CATEGORY_LABELS_EN: Record<string, string> = {
  wedding: "Wedding",
  dance: "Dance",
  kids: "Kids",
  brand: "Brand",
  lovestory: "Love Story",
  portrait: "Portrait",
  custom: "Other",
}

const BLOG_COPY = {
  uk: {
    home: "Головна",
    blog: "Блог",
    eyebrow: "Корисне",
    intro: "Поради про підготовку до зйомки, відповіді на часті питання і корисні гайди від команди MeTime Studio.",
    read: "Читати",
    materialOne: "матеріал",
    materialFew: "матеріали",
    materialMany: "матеріалів",
  },
  en: {
    home: "Home",
    blog: "Blog",
    eyebrow: "Helpful",
    intro: "Preparation tips, answers to common questions, and practical guides from the MeTime Studio team.",
    read: "Read",
    materialOne: "article",
    materialFew: "articles",
    materialMany: "articles",
  },
}

function formatDate(iso: string, locale: "uk" | "en") {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const locale = normalizeContentLocale((await cookies()).get("metime-locale")?.value)
  const copy = BLOG_COPY[locale]
  const categoryLabels = locale === "en" ? CATEGORY_LABELS_EN : CATEGORY_LABELS
  const allBlogPosts = await readBlogPosts()
  const blogPosts = allBlogPosts.filter((p) => p.published)

  const serviceTopics: ArticleCard[] = readServicesSync().flatMap((s) =>
    s.topics.map((t) => {
      const localized = getLocalizedTopic(t, locale)
      return {
        key: `${s.slug}-${t.slug}`,
        href: `/${s.slug}/${t.slug}`,
        category: s.slug,
        date: t.publishedAt,
        title: localized.title,
        description: localized.description,
      }
    })
  )

  const dynamicPosts: ArticleCard[] = blogPosts.map((p) => ({
    key: p.id,
    href: `/blog/${p.slug}`,
    category: p.category,
    date: p.publishedAt,
    title: p.translations?.[locale]?.title || p.title,
    description: p.translations?.[locale]?.description || p.description,
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
              { name: copy.home, url: "/" },
              { name: copy.blog, url: "/blog" },
            ])
          ),
        }}
      />
      <Navigation />
      <main className="page-main">
        <div className="page-container">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center gap-2 text-xs text-gray-mid">
              <li><a href="/" className="transition-colors hover:text-cream">{copy.home}</a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{copy.blog}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="page-hero">
            <p className="page-eyebrow">{copy.eyebrow}</p>
            <h1 className="page-title mb-4">
              {copy.blog}
            </h1>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-2xl text-gray-light">
                {copy.intro}
              </p>
              <span className="shrink-0 text-xs text-gray-mid">
                {all.length} {all.length === 1 ? copy.materialOne : all.length < 5 ? copy.materialFew : copy.materialMany}
              </span>
            </div>
          </div>

          {/* Articles */}
          <div className="content-grid sm:grid-cols-2">
            {all.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="group content-card relative flex flex-col"
              >
                {/* Wine left border on hover */}
                <span className="absolute left-0 top-0 h-0 w-px bg-wine transition-all duration-500 group-hover:h-full" />

                <div className="mb-4 flex items-center gap-3">
                  <span className="border border-wine/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-wine">
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-gray-mid">{formatDate(item.date, locale)}</span>
                </div>

                <h2 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-2xl">
                  {item.title}
                </h2>

                <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-mid line-clamp-3">
                  {item.description}
                </p>

                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-wine">
                  {copy.read}
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
