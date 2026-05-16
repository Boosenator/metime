"use client"

import type { ServiceData } from "@/lib/services/types"
import { useI18n } from "@/lib/i18n"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  const { t } = useI18n()

  return (
    <section id="services" className="section-shell bg-dark-card">
      <div className="section-container">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">{t.services.sectionLabel}</p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
            {t.services.title}
          </h2>
        </div>

        <div className="content-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="group content-card flex min-h-28 items-center gap-4"
            >
              <span className="font-mono text-xs text-wine/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-lg font-light text-cream transition-colors duration-300 group-hover:text-wine">
                {service.name}
              </span>
              <span className="ml-auto text-xs text-gray-mid opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
