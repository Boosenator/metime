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

        <div className="divide-y divide-white/8 border-y border-white/8">
          {services.map((service, i) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="group flex items-center justify-between py-6 transition-colors duration-300"
            >
              <div className="flex items-center gap-6">
                <span className="w-6 font-mono text-xs text-wine/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-2xl">
                  {service.name}
                </span>
              </div>
              <span className="text-xs uppercase tracking-[0.25em] text-gray-mid opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                Детальніше →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
