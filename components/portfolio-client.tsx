"use client"

import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { Play, X, ChevronLeft, ChevronRight, Images, LayoutGrid } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { PortfolioMosaic } from "@/components/portfolio-mosaic"
import { getPortfolioImageSrc } from "@/lib/portfolio/image-src"
import type { Cell, GridConfig, PhotoMeta } from "@/lib/portfolio/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type PopulatedCell = Cell & { photo: PhotoMeta }

type GalleryPhoto = {
  id: string
  filename: string
  src?: string
  category: string
  wide: boolean
}

type VideoItem = {
  id: number
  thumbnail: string
  category: string
  title: string
  duration: string
  videoUrl: string
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

const VIDEO_ITEMS: VideoItem[] = [
  { id: 101, thumbnail: "/images/portfolio/video-dance-1.jpg", category: "dance",   title: "Dynamic Vibes — Solo Performance", duration: "3:42", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 102, thumbnail: "/images/portfolio/video-dance-2.jpg", category: "dance",   title: "Energy Blend — Duo",               duration: "2:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 103, thumbnail: "/images/portfolio/video-wedding-1.jpg",category: "wedding", title: "Анна & Дмитро — Wedding Film",     duration: "4:28", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 104, thumbnail: "/images/portfolio/video-wedding-2.jpg",category: "wedding", title: "Олена & Артем — Ceremony",         duration: "3:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 105, thumbnail: "/images/portfolio/video-kids-1.jpg",  category: "kids",    title: "Birthday Party — Маленька Софія", duration: "2:47", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: 106, thumbnail: "/images/portfolio/video-kids-2.jpg",  category: "kids",    title: "Gender Party — Сюрприз",          duration: "1:45", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
]

const PHOTO_CATEGORY_IDS = ["all", "dance", "wedding", "kids", "brand", "lovestory", "portrait", "custom"] as const
const VIDEO_CATEGORY_IDS  = ["all", "dance", "wedding", "kids", "brand", "lovestory", "portrait", "custom"] as const

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
          className={`shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:px-4 md:py-2 md:text-[11px] ${
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
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className={`group relative cursor-pointer overflow-hidden ${photo.wide ? "col-span-2" : "col-span-1"}`}
          style={{ animation: "fadeScaleIn 0.5s ease both", animationDelay: `${index * 40}ms` }}
          onClick={() => onOpen(index)}
        >
          <div className={`relative w-full ${photo.wide ? "aspect-[16/10]" : "aspect-[3/4]"}`}>
            <img
              src={getPortfolioImageSrc(photo)}
              alt={photo.filename}
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
  videos: VideoItem[]
  onOpen: (item: VideoItem) => void
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
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/30 bg-dark/40 backdrop-blur-sm transition-all duration-300 group-hover:border-wine group-hover:bg-wine/70 group-hover:scale-110 md:h-20 md:w-20">
                <Play className="h-6 w-6 translate-x-0.5 text-cream md:h-7 md:w-7" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-dark/70 px-2 py-1 text-xs tracking-wide text-cream/80 backdrop-blur-sm">
              {item.duration}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-lg font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-xl">
              {item.title}
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
}: {
  cells: PopulatedCell[]
  grid: GridConfig
  photos: PhotoMeta[]
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"photo" | "video">("photo")
  const [photoView, setPhotoView] = useState<"mosaic" | "grid">("mosaic")
  const [isDesktop, setIsDesktop] = useState(false)
  const [photoFilter, setPhotoFilter] = useState("all")
  const [videoFilter, setVideoFilter] = useState("all")
  const [crossfade, setCrossfade] = useState(false)
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null)
  const [videoModal, setVideoModal] = useState<VideoItem | null>(null)

  // Build gallery photo list from PhotoMeta
  const galleryPhotos: GalleryPhoto[] = photos.map((p, i) => ({
    id: p.id,
    filename: p.filename,
    src: p.src,
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
    ? VIDEO_ITEMS
    : VIDEO_ITEMS.filter((v) => v.category === videoFilter)

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
  const openVideo = useCallback((item: VideoItem) => {
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
    const syncDesktop = () => {
      const nextIsDesktop = media.matches
      setIsDesktop(nextIsDesktop)
      if (!nextIsDesktop) {
        setPhotoView("grid")
      }
    }

    syncDesktop()
    media.addEventListener("change", syncDesktop)
    return () => media.removeEventListener("change", syncDesktop)
  }, [])

  return (
    <section id="portfolio" className="bg-dark py-16 lg:py-20">
      {/* Heading */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
      <div className="sticky top-12 z-40 bg-dark/95 px-6 py-4 backdrop-blur-md md:top-14 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Photo / Video toggle */}
          <div className="flex items-center gap-6 md:gap-12">
            {(["photo", "video"] as const).map((tab) => (
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

          {/* Mosaic / Grid toggle — only in photo mode */}
          {mode === "photo" && isDesktop && (
            <div className="hidden items-center gap-1 lg:flex">
              <button
                onClick={() => setPhotoView("mosaic")}
                aria-label="Мозаїка"
                className={`flex h-8 w-8 items-center justify-center transition-colors ${
                  photoView === "mosaic" ? "text-wine" : "text-gray-mid hover:text-cream"
                }`}
              >
                <Images className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPhotoView("grid")}
                aria-label="Сітка"
                className={`flex h-8 w-8 items-center justify-center transition-colors ${
                  photoView === "grid" ? "text-wine" : "text-gray-mid hover:text-cream"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className={`transition-opacity duration-300 ${crossfade ? "opacity-0" : "opacity-100"}`}>

        {/* ── Photo mosaic ─────────────────────────────────────────────── */}
        {mode === "photo" && isDesktop && photoView === "mosaic" && (
          <PortfolioMosaic cells={cells} grid={grid} />
        )}

        {/* ── Photo grid with category filters ─────────────────────────── */}
        {mode === "photo" && (!isDesktop || photoView === "grid") && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-6">
              <CategoryTabs
                categories={photoCategories}
                active={photoFilter}
                onChange={setPhotoFilter}
              />
            </div>
            <PhotoGrid photos={filteredPhotos} onOpen={openGallery} />
          </div>
        )}

        {/* ── Video with category filters ───────────────────────────────── */}
        {mode === "video" && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
          >
            <button onClick={closeGallery} className="absolute right-6 top-6 text-cream hover:text-wine transition-colors" aria-label="Close">
              <X className="h-8 w-8" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigateGallery("prev") }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-wine/70 hover:text-wine transition-colors md:left-8" aria-label="Previous">
              <ChevronLeft className="h-10 w-10" />
            </button>
            <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={getPortfolioImageSrc(filteredPhotos[galleryLightbox])}
                alt={filteredPhotos[galleryLightbox].filename}
                className="h-full w-full object-contain"
              />
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigateGallery("next") }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-wine/70 hover:text-wine transition-colors md:right-8" aria-label="Next">
              <ChevronRight className="h-10 w-10" />
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
          <div className="aspect-video w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`${videoModal.videoUrl}?autoplay=1`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={videoModal.title}
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
