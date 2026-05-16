import type { ServiceData } from "@/lib/services/types"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  return (
    <section id="services" className="bg-dark-card px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">Послуги</p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
            Що ми знімаємо
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
          {services.map((service, i) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="group flex items-center justify-center gap-3 border border-white/10 px-5 py-4 transition-colors duration-300 hover:border-wine sm:justify-start"
            >
              <span className="font-mono text-xs text-wine/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-base font-light text-cream transition-colors duration-300 group-hover:text-wine sm:text-lg">
                {service.name}
              </span>
              <span className="hidden text-xs text-gray-mid opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:inline">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
