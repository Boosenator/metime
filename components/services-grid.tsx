"use client"

import { useI18n } from "@/lib/i18n"
import type { ServiceData } from "@/lib/services/types"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  const { t } = useI18n()

  return (
    <section id="services" className="border-y border-white/8 bg-dark-card px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mb-5 text-xs uppercase tracking-[0.3em] text-wine">
          {t.services.sectionLabel}
        </p>

        <nav
          aria-label={t.services.sectionLabel}
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-3"
        >
          {services.map((service, index) => (
            <span key={service.slug} className="inline-flex items-center gap-4">
              <a
                href={`/${service.slug}`}
                className="font-serif text-2xl font-light leading-tight text-cream transition-colors hover:text-wine md:text-3xl"
              >
                {service.name}
              </a>
              {index < services.length - 1 && (
                <span className="text-sm text-white/15" aria-hidden="true">
                  /
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </section>
  )
}
