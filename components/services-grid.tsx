"use client"

import { useI18n } from "@/lib/i18n"
import type { ServiceData } from "@/lib/services/types"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  const { t } = useI18n()

  return (
    <section id="services" className="border-y border-white/8 bg-dark-card px-6 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="shrink-0 text-xs uppercase tracking-[0.3em] text-wine">
          {t.services.sectionLabel}
        </p>

        <nav
          aria-label={t.services.sectionLabel}
          className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end"
        >
          {services.map((service) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="text-sm text-gray-light underline-offset-4 transition-colors hover:text-cream hover:underline md:text-base"
            >
              {service.name}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
