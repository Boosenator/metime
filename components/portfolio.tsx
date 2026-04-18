"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { Play, X, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PhotoItem = {
  id: number
  src: string
  category: string
  alt: string
  wide?: boolean // hero shot — colspan 2
}

type VideoItem = {
  id: number
  thumbnail: string
  category: string
  title: string
  duration: string
  videoUrl: string
  alt: string
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const categoryIds = ["all", "dance", "wedding", "kids", "brand", "custom"] as const
const videoCategoryIds = ["all", "dance", "wedding", "kids", "brand", "custom"] as const

const photos: PhotoItem[] = [
  { id: 1, src: "/images/portfolio/dance-1.jpg", category: "dance", alt: "Танцювальна фотографія", wide: true },
  { id: 2, src: "/images/portfolio/dance-2.jpg", category: "dance", alt: "Dance performance" },
  { id: 3, src: "/images/portfolio/wedding-1.jpg", category: "wedding", alt: "Весільна фотографія", wide: true },
  { id: 4, src: "/images/portfolio/wedding-2.jpg", category: "wedding", alt: "Весільна церемонія" },
  { id: 5, src: "/images/portfolio/kids-1.jpg", category: "kids", alt: "Дитяча зйомка", wide: true },
  { id: 6, src: "/images/portfolio/kids-2.jpg", category: "kids", alt: "День народження" },
  { id: 7, src: "/images/portfolio/brand-1.jpg", category: "brand", alt: "Brand зйомка", wide: true },
  { id: 8, src: "/images/portfolio/brand-2.jpg", category: "brand", alt: "Комерційна зйомка" },
  { id: 9, src: "/images/portfolio/custom-1.jpg", category: "custom", alt: "Custom проєкт", wide: true },
]

const videos: VideoItem[] = [
  { id: 101, thumbnail: "/images/portfolio/video-dance-1.jpg", category: "dance", title: "Dynamic Vibes — Solo Performance", duration: "3:42", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Dance відео" },
  { id: 102, thumbnail: "/images/portfolio/video-dance-2.jpg", category: "dance", title: "Energy Blend — Duo", duration: "2:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Dance duo відео" },
  { id: 103, thumbnail: "/images/portfolio/video-wedding-1.jpg", category: "wedding", title: "Анна & Дмитро — Wedding Film", duration: "4:28", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Весільне відео" },
  { id: 104, thumbnail: "/images/portfolio/video-wedding-2.jpg", category: "wedding", title: "Олена & Артем — Ceremony", duration: "3:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Весільна церемонія відео" },
  { id: 105, thumbnail: "/images/portfolio/video-kids-1.jpg", category: "kids", title: "Birthday Party — Маленька Софія", duration: "2:47", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "День народження відео" },
  { id: 106, thumbnail: "/images/portfolio/video-kids-2.jpg", category: "kids", title: "Gender Party — Сюрприз", duration: "1:45", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Gender Party відео" },
  { id: 107, thumbnail: "/images/portfolio/video-brand-1.jpg", category: "brand", title: "Brand Film — Luxury Collection", duration: "1:30", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Комерційне відео" },
  { id: 108, thumbnail: "/images/portfolio/video-brand-2.jpg", category: "brand", title: "Course Creation — Studio Tour", duration: "5:01", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Brand відео" },
]

/* ------------------------------------------------------------------ */
/*  Portfolio Component                                                */
/* ------------------------------------------------------------------ */

export function Portfolio() {
  const { t } = useI18n()
  const [mode, setMode] = useState<"photo" | "video">("photo")
  const [photoFilter, setPhotoFilter] = useState("all")
  const [videoFilter, setVideoFilter] = useState("all")
  const [crossfade, setCrossfade] = useState(false)
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null)
  const [videoModal, setVideoModal] = useState<VideoItem | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Build categories from translations
  const photoCategories = categoryIds.map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories],
  }))
  const videoCategories = videoCategoryIds.map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories],
  }))

  /* Filtered lists */
  const filteredPhotos =
    photoFilter === "all"
      ? photos
      : photos.filter((p) => p.category === photoFilter)

  const filteredVideos =
    videoFilter === "all"
      ? videos
      : videos.filter((v) => v.category === videoFilter)

  /* Mode switching with crossfade */
  const switchMode = useCallback(
    (newMode: "photo" | "video") => {
      if (newMode === mode) return
      setCrossfade(true)
      setTimeout(() => {
        setMode(newMode)
        setCrossfade(false)
      }, 300)
    },
    [mode]
  )

  /* Photo lightbox */
  const openLightbox = useCallback((index: number) => {
    setLightbox({ index })
    document.body.style.overflow = "hidden"
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox(null)
    document.body.style.overflow = ""
  }, [])

  const navigateLightbox = useCallback(
    (dir: "prev" | "next") => {
      if (!lightbox) return
      const len = filteredPhotos.length
      const next =
        dir === "next"
          ? (lightbox.index + 1) % len
          : (lightbox.index - 1 + len) % len
      setLightbox({ index: next })
    },
    [lightbox, filteredPhotos.length]
  )

  /* Video modal */
  const openVideoModal = useCallback((item: VideoItem) => {
    setVideoModal(item)
    document.body.style.overflow = "hidden"
  }, [])

  const closeVideoModal = useCallback(() => {
    setVideoModal(null)
    document.body.style.overflow = ""
  }, [])

  /* Keyboard nav */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeLightbox()
        closeVideoModal()
      }
      if (lightbox) {
        if (e.key === "ArrowLeft") navigateLightbox("prev")
        if (e.key === "ArrowRight") navigateLightbox("next")
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [lightbox, closeLightbox, closeVideoModal, navigateLightbox])

  return (
    <section id="portfolio" className="bg-dark px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* ---- Section Header ---- */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
            {t.nav.portfolio}
          </p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl text-balance">
            {t.portfolio.title}
          </h2>
        </div>

        {/* ---- Big Switcher (Photo / Video) — Sticky ---- */}
        <div className="sticky top-12 z-40 -mx-6 bg-dark/95 px-6 py-4 backdrop-blur-md md:top-14 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-6 md:gap-12">
              <button
                onClick={() => switchMode("photo")}
                className="group relative pb-2 text-center"
              >
                <span
                  className={`text-sm font-medium uppercase tracking-[0.2em] transition-colors duration-300 md:text-base ${
                    mode === "photo" ? "text-cream" : "text-gray-mid"
                  }`}
                >
                  {t.portfolio.photo}
                </span>
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-wine transition-all duration-300 ${
                    mode === "photo" ? "w-full" : "w-0"
                  }`}
                />
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-gray-warm" />

              <button
                onClick={() => switchMode("video")}
                className="group relative pb-2 text-center"
              >
                <span
                  className={`text-sm font-medium uppercase tracking-[0.2em] transition-colors duration-300 md:text-base ${
                    mode === "video" ? "text-cream" : "text-gray-mid"
                  }`}
                >
                  {t.portfolio.video}
                </span>
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-wine transition-all duration-300 ${
                    mode === "video" ? "w-full" : "w-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ---- Content area with crossfade ---- */}
        <div
          className={`transition-opacity duration-300 ${
            crossfade ? "opacity-0" : "opacity-100"
          }`}
        >
          {mode === "photo" ? (
            <PhotoWorld
              categories={photoCategories}
              activeFilter={photoFilter}
              setActiveFilter={setPhotoFilter}
              items={filteredPhotos}
              openLightbox={openLightbox}
              tabsRef={tabsRef}
            />
          ) : (
            <VideoWorld
              categories={videoCategories}
              activeFilter={videoFilter}
              setActiveFilter={setVideoFilter}
              items={filteredVideos}
              openVideoModal={openVideoModal}
              tabsRef={tabsRef}
            />
          )}
        </div>
      </div>

      {/* ---- Photo Lightbox ---- */}
      {lightbox && filteredPhotos[lightbox.index] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-6 top-6 z-[60] text-cream transition-colors duration-300 hover:text-wine"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateLightbox("prev")
            }}
            className="absolute left-4 top-1/2 z-[60] -translate-y-1/2 text-wine/70 transition-colors duration-300 hover:text-wine md:left-8"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filteredPhotos[lightbox.index].src}
              alt={filteredPhotos[lightbox.index].alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateLightbox("next")
            }}
            className="absolute right-4 top-1/2 z-[60] -translate-y-1/2 text-wine/70 transition-colors duration-300 hover:text-wine md:right-8"
            aria-label="Next photo"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 z-[60] -translate-x-1/2 text-sm tracking-widest text-gray-mid">
            {lightbox.index + 1} / {filteredPhotos.length}
          </div>
        </div>
      )}

      {/* ---- Video Modal ---- */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.90)" }}
          onClick={closeVideoModal}
        >
          <button
            onClick={closeVideoModal}
            className="absolute right-6 top-6 z-[60] text-cream transition-colors duration-300 hover:text-wine"
            aria-label="Close video"
          >
            <X className="h-8 w-8" />
          </button>

          <div
            className="aspect-video w-[92vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={videoModal.videoUrl + "?autoplay=1"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={videoModal.title}
            />
          </div>
        </div>
      )}
    </section>
  )
}

/* ================================================================== */
/*  PHOTO WORLD                                                        */
/* ================================================================== */

function PhotoWorld({
  categories,
  activeFilter,
  setActiveFilter,
  items,
  openLightbox,
  tabsRef,
}: {
  categories: { id: string; label: string }[]
  activeFilter: string
  setActiveFilter: (id: string) => void
  items: PhotoItem[]
  openLightbox: (index: number) => void
  tabsRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      {/* Category filter tabs — horizontal scroll on mobile */}
      <div className="mb-6">
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:pb-0 scrollbar-none"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:px-4 md:py-2 md:text-[11px] ${
                activeFilter === cat.id
                  ? "border-b border-wine text-wine"
                  : "text-gray-mid hover:text-cream"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Grid — 3 columns desktop, first item per category is wide */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`group relative cursor-pointer overflow-hidden ${
              item.wide ? "col-span-2" : "col-span-1"
            }`}
            style={{
              animationDelay: `${i * 40}ms`,
              animation: "fadeScaleIn 0.5s ease both",
            }}
            onClick={() => openLightbox(i)}
          >
            <div
              className={`relative w-full ${
                item.wide ? "aspect-[16/10]" : "aspect-[3/4]"
              }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes={
                  item.wide
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 50vw, 33vw"
                }
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-dark/0 transition-all duration-500 group-hover:bg-dark/50">
                <div className="flex flex-col items-center gap-2 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  <Search className="h-5 w-5 text-cream/80" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-wine">
                    {categories.find((c) => c.id === item.category)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ================================================================== */
/*  VIDEO WORLD                                                        */
/* ================================================================== */

function VideoWorld({
  categories,
  activeFilter,
  setActiveFilter,
  items,
  openVideoModal,
  tabsRef,
}: {
  categories: { id: string; label: string }[]
  activeFilter: string
  setActiveFilter: (id: string) => void
  items: VideoItem[]
  openVideoModal: (item: VideoItem) => void
  tabsRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      {/* Category filter tabs — consistent with photo */}
      <div className="mb-6">
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:pb-0 scrollbar-none"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:px-4 md:py-2 md:text-[11px] ${
                activeFilter === cat.id
                  ? "border-b border-wine text-wine"
                  : "text-gray-mid hover:text-cream"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial video cards — 2 cols desktop, 1 col mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="group cursor-pointer"
            style={{
              animationDelay: `${i * 50}ms`,
              animation: "fadeScaleIn 0.5s ease both",
            }}
            onClick={() => openVideoModal(item)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={item.thumbnail}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/30 bg-dark/40 backdrop-blur-sm transition-all duration-400 group-hover:border-wine group-hover:bg-wine/70 group-hover:scale-110 md:h-20 md:w-20">
                  <Play
                    className="h-6 w-6 translate-x-0.5 text-cream md:h-7 md:w-7"
                    fill="currentColor"
                  />
                </div>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 bg-dark/70 px-2 py-1 text-xs tracking-wide text-cream/80 backdrop-blur-sm">
                {item.duration}
              </div>
            </div>

            {/* Meta */}
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-mid">
                  {categories.find((c) => c.id === item.category)?.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
