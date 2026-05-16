import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ServicesLabel } from "@/components/i18n-text"
import { I18nProvider } from "@/lib/i18n"
import { readServicesSync, getServiceSync as getService } from "@/lib/services/storage"
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
  SITE_NAME,
  OG_IMAGE,
} from "@/lib/seo"

export function generateStaticParams() {
  return readServicesSync().map((s) => ({ service: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service: slug } = await params
  const service = getService(slug)
  if (!service) return {}

  return {
    title: service.title,
    description: service.description,
    keywords: service.keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${service.title} | ${SITE_NAME}`,
      description: service.description,
      url: absoluteUrl(`/${slug}`),
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: service.name }],
    },
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service: slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  return (
    <I18nProvider>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildServiceJsonLd(service),
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: service.name, url: `/${slug}` },
            ]),
          ]),
        }}
      />
      <Navigation />
      <main className="page-main">
        <div className="page-container">

          {/* Hero */}
          <div className="page-hero">
            <p className="page-eyebrow"><ServicesLabel /></p>
            <h1 className="page-title mb-6">
              {service.name}
            </h1>
            <div className="max-w-2xl space-y-4 text-base leading-relaxed text-gray-light md:text-lg">
              {service.intro.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Topics grid */}
          <section aria-labelledby="topics-heading" className="mb-20">
            <p
              id="topics-heading"
              className="mb-8 text-xs uppercase tracking-[0.3em] text-wine"
            >
              Корисні матеріали
            </p>
            <div className="content-grid md:grid-cols-3">
              {service.topics.map((topic) => (
                <a
                  key={topic.slug}
                  href={`/${slug}/${topic.slug}`}
                  className="group content-card"
                >
                  <h2 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine">
                    {topic.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-mid">
                    {topic.description}
                  </p>
                  <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Читати →
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="cta-panel">
            <p className="mb-6 font-serif text-3xl font-light text-cream">
              Хочете поговорити про вашу зйомку?
            </p>
            <p className="mb-8 text-gray-light">
              Розкажіть нам про вашу ідею — ми підберемо формат і відповімо на всі питання.
            </p>
            <a
              href="/#contact"
              className="outline-cta px-10"
            >
              Написати нам
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </I18nProvider>
  )
}
