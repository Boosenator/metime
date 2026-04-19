"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"

/*
 * Hero section with background video.
 * Put your videos at:
 *   public/media/hero/desktop.mp4  (horizontal 16:9)
 *   public/media/hero/mobile.mp4   (vertical 9:16)
 * If the files are missing the poster image is shown instead.
 */

const DESKTOP_VIDEO = "/media/hero/desktop.mp4"
const MOBILE_VIDEO = "/media/hero/mobile.mp4"
const HERO_POSTER = "/images/hero-poster.jpg"

export function Hero({
  hasDesktopVideo,
  hasMobileVideo,
}: {
  hasDesktopVideo: boolean
  hasMobileVideo: boolean
}) {
  const { t } = useI18n()
  const desktopVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = desktopVideoRef.current
    if (!v) return
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }, [])

  useEffect(() => {
    const v = mobileVideoRef.current
    if (!v) return
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }, [])

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* Background video — Desktop (16:9) */}
      <div className="absolute inset-0 hidden md:block">
        {hasDesktopVideo ? (
          <video
            ref={desktopVideoRef}
            src={DESKTOP_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            poster={HERO_POSTER}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            fill
            priority
            className="hero-poster-zoom object-cover"
            sizes="100vw"
          />
        )}
      </div>

      {/* Background video — Mobile (9:16) */}
      <div className="absolute inset-0 md:hidden">
        {hasMobileVideo ? (
          <video
            ref={mobileVideoRef}
            src={MOBILE_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            poster={HERO_POSTER}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            fill
            priority
            className="hero-poster-zoom object-cover"
            sizes="100vw"
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
