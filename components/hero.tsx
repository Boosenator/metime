"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"

/*
 * Hero video з підтримкою двох форматів:
 * - Desktop: горизонтальне 16:9
 * - Mobile: вертикальне 9:16
 *
 * Поки що використовується stock відео з Blob.
 * Замініть на свої файли у seed-video API.
 */

export function Hero() {
  const { t } = useI18n()
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)
  const [desktopUrl, setDesktopUrl] = useState<string | null>(null)
  const [mobileUrl, setMobileUrl] = useState<string | null>(null)

  // Fetch or seed video URLs from Blob (desktop + mobile)
  useEffect(() => {
    async function loadVideos() {
      try {
        const res = await fetch("/api/seed-video")
        const data = await res.json()
        if (data.desktop) setDesktopUrl(data.desktop)
        if (data.mobile) setMobileUrl(data.mobile)
      } catch (e) {
        console.error("Failed to load videos:", e)
      }
    }
    loadVideos()
  }, [])

  // Play desktop video
  useEffect(() => {
    if (!desktopUrl) return
    const v = desktopVideoRef.current
    if (!v) return
    v.load()
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }, [desktopUrl])

  // Play mobile video
  useEffect(() => {
    if (!mobileUrl) return
    const v = mobileVideoRef.current
    if (!v) return
    v.load()
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }, [mobileUrl])

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* Background video - Desktop (16:9 horizontal) */}
      <div className="absolute inset-0 hidden md:block">
        {desktopUrl ? (
          <video
            ref={desktopVideoRef}
            src={desktopUrl}
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero-poster.jpg"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url(/images/hero-poster.jpg)" }}
          />
        )}
      </div>

      {/* Background video - Mobile (9:16 vertical) */}
      <div className="absolute inset-0 md:hidden">
        {mobileUrl ? (
          <video
            ref={mobileVideoRef}
            src={mobileUrl}
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero-poster.jpg"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url(/images/hero-poster.jpg)" }}
          />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/50 to-dark/80" />

      {/* Content */}
      <div className="relative z-10 px-6 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-gray-light md:text-sm">
          {t.hero.subtitle}
        </p>
        <h1 className="font-serif text-4xl font-light leading-tight text-cream md:text-6xl lg:text-7xl xl:text-8xl">
          <span className="text-balance">
            {t.hero.title1}
            <br />
            {t.hero.title2}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm text-gray-light md:text-base">
          {t.hero.location}
        </p>
        <a
          href="#contact"
          className="group mt-10 inline-block border border-cream/30 px-10 py-4 text-xs uppercase tracking-[0.3em] text-cream transition-all duration-500 hover:border-wine hover:bg-wine"
        >
          {t.hero.cta}
        </a>
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
