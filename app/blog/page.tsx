import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { readBlogPosts } from "@/lib/blog/storage"
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
  })
}

export default async function BlogPage() {
  const all = await readBlogPosts()
  const posts = all
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

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

          {posts.length === 0 ? (
            <p className="text-gray-mid">Скоро тут з'являться перші статті.</p>
          ) : (
            <div className="divide-y divide-white/8">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block py-8 transition-colors"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-wine">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                    <span className="text-xs text-gray-mid">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mb-2 font-serif text-2xl font-light text-cream transition-colors group-hover:text-wine md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-light line-clamp-2">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-wine opacity-0 transition-opacity group-hover:opacity-100">
                    Читати →
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </I18nProvider>
  )
}
