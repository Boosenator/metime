"use client"

import { Instagram } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { ServiceData } from "@/lib/services/types"

export function Footer({ services = [] }: { services?: ServiceData[] }) {
  const { t } = useI18n()

  return (
    <footer className="border-t border-gray-warm/30 bg-dark px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {/* Logo */}
        <a
          href="/"
          onClick={(e) => {
            if (window.location.pathname === "/") {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          }}
          className="flex flex-col items-center leading-none"
        >
          <span className="font-serif text-2xl font-semibold tracking-wide text-cream">
            MeTime
          </span>
          <span className="text-[9px] uppercase tracking-[0.35em] text-gray-mid">
            studio
          </span>
        </a>

        {/* Tagline */}
        <p className="text-center text-sm text-gray-mid">
          {t.footer.tagline}
        </p>

        {services.length > 0 && (
          <nav
            aria-label={t.services.sectionLabel}
            className="flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y border-white/8 px-4 py-5"
          >
            {services.map((service, index) => (
              <span key={service.slug} className="inline-flex items-center gap-4">
                <a
                  href={`/${service.slug}`}
                  className="font-serif text-lg font-light text-gray-light transition-colors hover:text-cream"
                >
                  {service.name}
                </a>
                {index < services.length - 1 && (
                  <span className="text-xs text-white/15" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Social */}
        <a
          href="https://instagram.com/metime_ck"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-mid transition-colors duration-300 hover:text-wine"
          aria-label="Instagram"
        >
          <Instagram className="h-5 w-5" />
        </a>

        {/* Location & Copyright */}
        <div className="flex flex-col items-center gap-1 text-xs text-gray-mid">
          <span>{t.footer.location}</span>
          <span>{`© ${new Date().getFullYear()} MeTime. `}{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  )
}
