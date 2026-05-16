import type { ServiceData } from "@/lib/services/types"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  return (
    <section id="services" className="bg-dark px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">Послуги</p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
            Що ми знімаємо
          </h2>
        </div>

        <div className="grid gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="group relative bg-dark p-8 transition-colors duration-300 hover:bg-dark-card"
            >
              <span className="mb-6 block font-mono text-xs text-wine/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine">
                {service.name}
              </h3>
              <p className="text-sm leading-relaxed text-gray-mid line-clamp-3">
                {service.intro || service.description}
              </p>
              <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Детальніше →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
