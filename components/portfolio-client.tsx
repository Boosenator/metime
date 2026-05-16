"use client"

import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { Play, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { PortfolioMosaic } from "@/components/portfolio-mosaic"
import { VideoPosterFrame } from "@/components/video-poster-frame"
import { getPortfolioImageSrc, getPortfolioVideoSrc, photoAlt } from "@/lib/portfolio/image-src"
import type { Cell, GridConfig, PhotoMeta, VideoMeta } from "@/lib/portfolio/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type PopulatedCell = Cell & { photo: PhotoMeta }

type GalleryPhoto = {
  id: string
  filename: string
  src?: string
  title?: string
  alt?: string
  caption?: string
  category: string
  wide: boolean
}

// ─── Static data ──────────────────────────────────────────────────────────────

const SUPPORTED_CATEGORIES = new Set(["dance", "wedding", "kids", "brand", "custom", "lovestory", "portrait", "commercial"])

function normalizeCategory(category: string): string {
  return category === "commercial" ? "brand" : category
}

function getCategory(filename: string): string {
  const prefix = filename.toLowerCase().split("-")[0]
  return SUPPORTED_CATEGORIES.has(prefix) ? normalizeCategory(prefix) : "custom"
}

const PHOTO_CATEGORY_IDS = ["all", "dance", "wedding", "kids", "brand", "lovestory", "portrait", "custom"] as const
const VIDEO_CATEGORY_IDS  = ["all", "dance", "wedding", "kids", "brand", "lovestory", "custom"] as const

// ─── Subcomponents ────────────────────────────────────────────────────────────

function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:pb-0 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`min-h-11 shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:min-h-0 md:px-4 md:py-2 md:text-[11px] ${
            active === cat.id
              ? "border-b border-wine text-wine"
              : "text-gray-mid hover:text-cream"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}

function PhotoGrid({
  photos,
  onOpen,
}: {
  photos: GalleryPhoto[]
  onOpen: (index: number) => void
}) {
  return (
    <div className="grid grid-flow-dense grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className={`group relative cursor-pointer overflow-hidden ${photo.wide ? "col-span-1 md:col-span-2" : "col-span-1"}`}
          style={{ animation: "fadeScaleIn 0.5s ease both", animationDelay: `${index * 40}ms` }}
          onClick={() => onOpen(index)}
        >
          <div className={`relative w-full ${photo.wide ? "aspect-[3/4] md:aspect-[16/10]" : "aspect-[3/4]"}`}>
            <img
              src={getPortfolioImageSrc(photo)}
              alt={photoAlt(photo)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-dark/0 transition-all duration-500 group-hover:bg-dark/50">
              <div className="flex flex-col items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ChevronRight className="h-5 w-5 rotate-45 text-cream/80" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VideoGrid({
  videos,
  onOpen,
}: {
  videos: VideoMeta[]
  onOpen: (item: VideoMeta) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      {videos.map((item, index) => (
        <div
          key={item.id}
          className="group cursor-pointer"
          style={{ animation: "fadeScaleIn 0.5s ease both", animationDelay: `${index * 50}ms` }}
          onClick={() => onOpen(item)}
        >
          <div className="relative aspect-video overflow-hidden">
            <VideoPosterFrame
              src={getPortfolioVideoSrc(item)}
              seekTo={item.posterTime ?? 0}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/30 bg-dark/40 backdrop-blur-sm transition-all duration-300 group-hover:border-wine group-hover:bg-wine/70 group-hover:scale-110 md:h-20 md:w-20">
                <Play className="h-6 w-6 translate-x-0.5 text-cream md:h-7 md:w-7" fill="currentColor" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-lg font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-xl">
              {item.title || item.filename}
            </h3>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PortfolioClient({
  cells,
  grid,
  photos,
  videos,
}: {
  cells: PopulatedCell[]
  grid: GridConfig
  photos: PhotoMeta[]
  videos: VideoMeta[]
}) {
  const { t } = useI18n()
  const hasVideos = videos.length > 0
  const portfolioTabs: Array<"photo" | "video"> = hasVideos ? ["video", "photo"] : ["photo"]
  const [mode, setMode] = useState<"photo" | "video">(hasVideos ? "video" : "photo")
  const [isDesktop, setIsDesktop] = useState(false)
  const [photoFilter, setPhotoFilter] = useState("all")
  const [videoFilter, setVideoFilter] = useState("all")
  const [crossfade, setCrossfade] = useState(false)
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null)
  const [videoModal, setVideoModal] = useState<VideoMeta | null>(null)
  const [showScrollActions, setShowScrollActions] = useState(false)
  const touchStartX = useRef(0)

  // Build gallery photo list from PhotoMeta
  const galleryPhotos: GalleryPhoto[] = photos.map((p, i) => ({
    id: p.id,
    filename: p.filename,
    src: p.src,
    title: p.title,
    alt: p.alt,
    caption: p.caption,
    category: p.category && SUPPORTED_CATEGORIES.has(p.category) ? normalizeCategory(p.category) : getCategory(p.filename),
    wide: i % 5 === 0 || i % 7 === 0,
  }))

  const photoCategories = (PHOTO_CATEGORY_IDS as readonly string[]).map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories] ?? id,
  }))
  const videoCategories = (VIDEO_CATEGORY_IDS as readonly string[]).map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories] ?? id,
  }))

  const filteredPhotos = photoFilter === "all"
    ? galleryPhotos
    : galleryPhotos.filter((p) => p.category === photoFilter)

  const filteredVideos = videoFilter === "all"
    ? videos
    : videos.filter((video) => normalizeCategory(video.category ?? "custom") === videoFilter)

  const switchMode = useCallback((next: "photo" | "video") => {
    if (next === mode) return
    setCrossfade(true)
    setTimeout(() => { setMode(next); setCrossfade(false) }, 300)
  }, [mode])

  // Gallery lightbox close / navigate
  const closeGallery = useCallback(() => {
    setGalleryLightbox(null)
    document.body.style.overflow = ""
  }, [])
  const openGallery = useCallback((i: number) => {
    setGalleryLightbox(i)
    document.body.style.overflow = "hidden"
  }, [])
  const navigateGallery = useCallback((dir: "prev" | "next") => {
    setGalleryLightbox((prev) => {
      if (prev === null) return null
      const len = filteredPhotos.length
      return dir === "next" ? (prev + 1) % len : (prev - 1 + len) % len
    })
  }, [filteredPhotos.length])

  // Video modal
  const closeVideo = useCallback(() => {
    setVideoModal(null)
    document.body.style.overflow = ""
  }, [])
  const openVideo = useCallback((item: VideoMeta) => {
    setVideoModal(item)
    document.body.style.overflow = "hidden"
  }, [])

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { closeGallery(); closeVideo() }
      if (galleryLightbox !== null) {
        if (e.key === "ArrowLeft") navigateGallery("prev")
        if (e.key === "ArrowRight") navigateGallery("next")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [galleryLightbox, closeGallery, closeVideo, navigateGallery])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)")
    const syncDesktop = () => setIsDesktop(media.matches)
    syncDesktop()
    media.addEventListener("change", syncDesktop)
    return () => media.removeEventListener("change", syncDesktop)
  }, [])

  useEffect(() => {
    if (!hasVideos && mode === "video") {
      setMode("photo")
    }
  }, [hasVideos, mode])

  const PAGE_SECTIONS = ["portfolio", "services", "pricing", "blog-preview", "team", "contact"]

  const getCurrentSectionIdx = useCallback(() => {
    const scrolled = window.scrollY + 10
    let idx = -1
    for (let i = 0; i < PAGE_SECTIONS.length; i++) {
      const el = document.getElementById(PAGE_SECTIONS[i])
      if (el) {
        const absoluteTop = el.getBoundingClientRect().top + window.scrollY
        if (absoluteTop <= scrolled) idx = i
      }
    }
    return idx
  }, [])

  const scrollToPrev = useCallback(() => {
    const idx = getCurrentSectionIdx()
    if (idx <= 0) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      document.getElementById(PAGE_SECTIONS[idx - 1])?.scrollIntoView({ behavior: "smooth" })
    }
  }, [getCurrentSectionIdx])

  const scrollToNext = useCallback(() => {
    const idx = getCurrentSectionIdx()
    const next = idx + 1
    if (next < PAGE_SECTIONS.length) {
      document.getElementById(PAGE_SECTIONS[next])?.scrollIntoView({ behavior: "smooth" })
    }
  }, [getCurrentSectionIdx])

  useEffect(() => {
    const onScroll = () => setShowScrollActions(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section id="portfolio" className="bg-dark py-16 lg:py-20">
      {/* Heading */}
      <div className="site-container">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
            {t.nav.portfolio}
          </p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl text-balance">
            {t.portfolio.title}
          </h2>
        </div>
      </div>

      {/* Sticky tabs bar */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 bg-dark/95 px-6 py-4 backdrop-blur-md md:top-20 lg:px-8">
        <div className="section-container flex items-center justify-between">
          {/* Photo / Video toggle */}
          <div className="flex items-center gap-6 md:gap-12">
            {portfolioTabs.map((tab) => (
              <button key={tab} onClick={() => switchMode(tab)} className="group relative pb-2 text-center">
                <span className={`text-sm font-medium uppercase tracking-[0.2em] transition-colors duration-300 md:text-base ${
                  mode === tab ? "text-cream" : "text-gray-mid"
                }`}>
                  {tab === "photo" ? t.portfolio.photo : t.portfolio.video}
                </span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-wine transition-all duration-300 ${
                  mode === tab ? "w-full" : "w-0"
                }`} />
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Content area */}
      <div className={`transition-opacity duration-300 ${crossfade ? "opacity-0" : "opacity-100"}`}>

        {/* ── Photo mode ───────────────────────────────────────────────── */}
        {mode === "photo" && (
          <>
            {/* Category tabs — always visible; selecting non-all switches to grid */}
            <div className="site-container">
              <div className="mb-6">
                <CategoryTabs
                  categories={photoCategories}
                  active={photoFilter}
                  onChange={setPhotoFilter}
                />
              </div>
            </div>

            {isDesktop && photoFilter === "all" ? (
              <div className="site-container">
                <PortfolioMosaic cells={cells} grid={grid} />
              </div>
            ) : (
              <div className="site-container">
                <PhotoGrid photos={filteredPhotos} onOpen={openGallery} />
              </div>
            )}
          </>
        )}

        {/* ── Video with category filters ───────────────────────────────── */}
        {mode === "video" && (
          <div className="site-container">
            <div className="mb-6">
              <CategoryTabs
                categories={videoCategories}
                active={videoFilter}
                onChange={setVideoFilter}
              />
            </div>
            <VideoGrid videos={filteredVideos} onOpen={openVideo} />
          </div>
        )}
      </div>

      {/* ── Gallery lightbox (portal) ─────────────────────────────────── */}
      {galleryLightbox !== null && filteredPhotos[galleryLightbox] &&
        typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
            onClick={closeGallery}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current
              if (Math.abs(dx) > 50) {
                e.stopPropagation()
                if (dx > 0) navigateGallery("prev")
                else navigateGallery("next")
              }
            }}
          >
            <button onClick={closeGallery} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center bg-black/40 text-cream hover:text-wine transition-colors md:right-6 md:top-6" aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateGallery("prev") }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center bg-black/40 text-cream hover:text-wine transition-colors md:left-8"
              aria-label="Previous"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={getPortfolioImageSrc(filteredPhotos[galleryLightbox])}
                alt={photoAlt(filteredPhotos[galleryLightbox])}
                className="h-full w-full object-contain"
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigateGallery("next") }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center bg-black/40 text-cream hover:text-wine transition-colors md:right-8"
              aria-label="Next"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-widest text-gray-mid">
              {galleryLightbox + 1} / {filteredPhotos.length}
            </div>
          </div>,
          document.body
        )
      }

      {/* ── Video modal (portal) ──────────────────────────────────────── */}
      {videoModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.90)" }}
          onClick={closeVideo}
        >
          <button onClick={closeVideo} className="absolute right-6 top-6 text-cream hover:text-wine transition-colors" aria-label="Close">
            <X className="h-8 w-8" />
          </button>
          <div className="flex h-[84vh] w-[96vw] max-w-7xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <video
              src={getPortfolioVideoSrc(videoModal)}
              className="max-h-full w-full object-contain"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>,
        document.body
      )}
      {/* ── Floating scroll actions ───────────────────────────────────── */}
      {showScrollActions && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-6 right-4 z-40 flex flex-col">
          <button
            onClick={scrollToPrev}
            className="flex h-10 w-10 items-center justify-center border border-white/15 bg-dark/85 text-gray-mid backdrop-blur-sm transition-all duration-300 hover:border-wine hover:text-cream"
            aria-label="Попередній розділ"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={scrollToNext}
            className="flex h-10 w-10 items-center justify-center border-x border-b border-white/15 bg-dark/85 text-gray-mid backdrop-blur-sm transition-all duration-300 hover:border-wine hover:text-cream"
            aria-label="Наступний розділ"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>,
        document.body
      )}
    </section>
  )
}
