import type { ServiceData } from "@/lib/services/types"

export function ServicesGrid({ services }: { services: ServiceData[] }) {
  return (
    <section id="services" className="bg-dark px-6 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="divide-y divide-white/8 border-y border-white/8">
          {services.map((service, i) => (
            <a
              key={service.slug}
              href={`/${service.slug}`}
              className="group flex items-center justify-between py-5 transition-colors duration-300 hover:text-wine"
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
