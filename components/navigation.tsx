"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useI18n, type Locale } from "@/lib/i18n"

export function Navigation() {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navLinks = [
    { label: t.nav.portfolio, href: "#portfolio" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.team, href: "#team" },
    { label: t.nav.contact, href: "#contact" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleNavClick = () => {
    setIsOpen(false)
  }

  const toggleLocale = () => {
    setLocale(locale === "uk" ? "en" : "uk")
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-gray-warm/70 backdrop-blur-md transition-all duration-500 ${
          isScrolled ? "py-2 md:py-4" : "py-3 md:py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-semibold tracking-wide text-cream lg:text-3xl">
              MeTime
            </span>
            <span className="text-[9px] uppercase tracking-[0.35em] text-gray-mid lg:text-[10px]">
              studio
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex lg:gap-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium uppercase tracking-[0.2em] text-gray-light transition-colors duration-300 hover:text-cream"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-wine transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="ml-2 flex items-center gap-1 border border-gray-warm/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-gray-light transition-all duration-300 hover:border-wine hover:text-cream"
            >
              <span className={locale === "uk" ? "text-wine" : ""}>UA</span>
              <span className="text-gray-warm">/</span>
              <span className={locale === "en" ? "text-wine" : ""}>EN</span>
            </button>
          </nav>

          {/* Mobile: Language + Hamburger */}
          <div className="flex items-center gap-4 md:hidden">
            {/* Language Toggle Mobile */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-gray-light"
            >
              <span className={locale === "uk" ? "text-wine" : ""}>UA</span>
              <span className="text-gray-warm">/</span>
              <span className={locale === "en" ? "text-wine" : ""}>EN</span>
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              <span
                className={`block h-px w-6 bg-cream transition-all duration-300 ${
                  isOpen ? "translate-y-[1px] rotate-45" : "-translate-y-1"
                }`}
              />
              <span
                className={`block h-px w-6 bg-cream transition-all duration-300 ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-px w-6 bg-cream transition-all duration-300 ${
                  isOpen ? "-translate-y-[1px] -rotate-45" : "translate-y-1"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark/98 transition-all duration-500 md:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-6 top-6 z-[60] flex h-10 w-10 items-center justify-center text-cream transition-colors duration-300 hover:text-wine"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>

        <nav className="flex flex-col items-center gap-8">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className="font-serif text-3xl font-light text-cream transition-all duration-300 hover:text-wine"
              style={{
                transitionDelay: isOpen ? `${i * 80}ms` : "0ms",
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={handleNavClick}
            className="mt-6 border border-wine px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-wine"
            style={{
              transitionDelay: isOpen ? `${navLinks.length * 80}ms` : "0ms",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(20px)",
            }}
          >
            {t.nav.book}
          </a>
        </nav>
      </div>
    </>
  )
}
