"use client"

import { useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function Hero({
  desktopVideoSrc,
  mobileVideoSrc,
}: {
  desktopVideoSrc: string | null
  mobileVideoSrc: string | null
}) {
  const { t } = useI18n()
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Fallback: деякі браузери ігнорують autoplay до взаємодії
    for (const ref of [desktopVideoRef, mobileVideoRef]) {
      const v = ref.current
      if (!v || !v.paused) continue
      v.play().catch(() => {})
    }
  }, [])

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height: "100svh", transform: "translateZ(0)" }}
    >
      {/* Background video — Desktop (16:9) */}
      <div className="absolute inset-0 hidden md:block" style={{ transform: "translateZ(0)" }}>
        {desktopVideoSrc ? (
          <video
            ref={desktopVideoRef}
            src={desktopVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Background video — Mobile (9:16) */}
      <div className="absolute inset-0 md:hidden" style={{ transform: "translateZ(0)" }}>
        {mobileVideoSrc ? (
          <video
            ref={mobileVideoRef}
            src={mobileVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/50 to-dark/80" />

      {/* Content */}
      <div className="relative z-10 px-6 text-center">
        <h1 className="mb-4 text-xs uppercase tracking-[0.4em] text-gray-light md:text-sm">
          {t.hero.subtitle}
        </h1>
        <p className="font-serif text-4xl font-light leading-tight text-cream md:text-6xl lg:text-7xl xl:text-8xl">
          <span className="text-balance">
            {t.hero.title1}
            <br />
            {t.hero.title2}
          </span>
        </p>
        <a
          href="#contact"
          className="group mt-10 inline-block border border-cream/30 px-10 py-4 text-xs uppercase tracking-[0.3em] text-cream transition-all duration-500 hover:border-wine hover:bg-wine"
        >
          {t.hero.cta}
        </a>
        <p className="mx-auto mt-8 max-w-sm text-[11px] leading-relaxed text-gray-mid/60">
          {t.hero.seoText}
        </p>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
        <a
          href="#portfolio"
          className="flex flex-col items-center gap-2 text-gray-mid transition-colors duration-300 hover:text-cream"
          aria-label="Scroll down"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">{t.hero.scroll}</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  )
}
