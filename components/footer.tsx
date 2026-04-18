"use client"

import { Instagram } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-gray-warm/30 bg-dark px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {/* Logo */}
        <a href="#" className="flex flex-col items-center leading-none">
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
          <span>{"© 2025 MeTime. "}{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  )
}
