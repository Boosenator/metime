"use client"

import { useState, useCallback, useEffect, useRef, type RefObject } from "react"
import Image from "next/image"
import { Play, X, ChevronLeft, ChevronRight, Search, LayoutGrid, Images } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { PortfolioPhoto } from "@/lib/get-portfolio-photos"
import { useMosaicReveal } from "@/hooks/use-mosaic-reveal"
import { useCardTilt } from "@/hooks/use-card-tilt"

type PhotoItem = {
  id: number
  src: string
  fullSrc?: string
  category: string
  alt: string
  wide?: boolean
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

const categoryIds = ["all", "dance", "wedding", "kids", "brand", "custom"] as const
const videoCategoryIds = ["all", "dance", "wedding", "kids", "brand", "custom"] as const

const fallbackPhotos: PhotoItem[] = [
  { id: 1, src: "/images/portfolio/dance-1.jpg", category: "dance", alt: "Танцювальна фотографія", wide: true },
  { id: 2, src: "/images/portfolio/dance-2.jpg", category: "dance", alt: "Dance performance" },
  { id: 3, src: "/images/portfolio/wedding-1.jpg", category: "wedding", alt: "Весільна фотографія", wide: true },
  { id: 4, src: "/images/portfolio/wedding-2.jpg", category: "wedding", alt: "Весільна церемонія" },
  { id: 5, src: "/images/portfolio/kids-1.jpg", category: "kids", alt: "Дитяча зйомка", wide: true },
  { id: 6, src: "/images/portfolio/kids-2.jpg", category: "kids", alt: "День народження" },
]

const videos: VideoItem[] = [
  { id: 101, thumbnail: "/images/portfolio/video-dance-1.jpg", category: "dance", title: "Dynamic Vibes — Solo Performance", duration: "3:42", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Dance відео" },
  { id: 102, thumbnail: "/images/portfolio/video-dance-2.jpg", category: "dance", title: "Energy Blend — Duo", duration: "2:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Dance duo відео" },
  { id: 103, thumbnail: "/images/portfolio/video-wedding-1.jpg", category: "wedding", title: "Анна & Дмитро — Wedding Film", duration: "4:28", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Весільне відео" },
  { id: 104, thumbnail: "/images/portfolio/video-wedding-2.jpg", category: "wedding", title: "Олена & Артем — Ceremony", duration: "3:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Весільна церемонія відео" },
  { id: 105, thumbnail: "/images/portfolio/video-kids-1.jpg", category: "kids", title: "Birthday Party — Маленька Софія", duration: "2:47", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "День народження відео" },
  { id: 106, thumbnail: "/images/portfolio/video-kids-2.jpg", category: "kids", title: "Gender Party — Сюрприз", duration: "1:45", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", alt: "Gender Party відео" },
]

export function Portfolio({
  mosaicPhotos = [],
  galleryPhotos = [],
}: {
  mosaicPhotos?: PortfolioPhoto[]
  galleryPhotos?: PortfolioPhoto[]
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"photo" | "video">("photo")
  const [photoView, setPhotoView] = useState<"mosaic" | "grid">("mosaic")
  const [photoFilter, setPhotoFilter] = useState("all")
  const [videoFilter, setVideoFilter] = useState("all")
  const [crossfade, setCrossfade] = useState(false)
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null)
  const [videoModal, setVideoModal] = useState<VideoItem | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  const photoCatalog: PhotoItem[] = galleryPhotos.length ? galleryPhotos : fallbackPhotos
  const mosaicCatalog: PhotoItem[] = mosaicPhotos.length ? mosaicPhotos : photoCatalog

  const photoCategories = categoryIds.map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories],
  }))
  const videoCategories = videoCategoryIds.map((id) => ({
    id,
    label: t.portfolio.categories[id as keyof typeof t.portfolio.categories],
  }))

  const filteredPhotos =
    photoFilter === "all"
      ? photoCatalog
      : photoCatalog.filter((photo) => photo.category === photoFilter)

  const filteredVideos =
    videoFilter === "all" ? videos : videos.filter((video) => video.category === videoFilter)

  const displayPhotos = photoView === "mosaic" ? mosaicCatalog : filteredPhotos

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
      const len = displayPhotos.length
      const next =
        dir === "next"
          ? (lightbox.index + 1) % len
          : (lightbox.index - 1 + len) % len
      setLightbox({ index: next })
    },
    [lightbox, displayPhotos.length]
  )

  const openVideoModal = useCallback((item: VideoItem) => {
    setVideoModal(item)
    document.body.style.overflow = "hidden"
  }, [])

  const closeVideoModal = useCallback(() => {
    setVideoModal(null)
    document.body.style.overflow = ""
  }, [])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox()
        closeVideoModal()
      }
      if (lightbox) {
        if (event.key === "ArrowLeft") navigateLightbox("prev")
        if (event.key === "ArrowRight") navigateLightbox("next")
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [lightbox, closeLightbox, closeVideoModal, navigateLightbox])

  return (
    <section id="portfolio" className="bg-dark py-16 lg:py-20">
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
              {t.nav.portfolio}
            </p>
            <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl text-balance">
              {t.portfolio.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="sticky top-12 z-40 bg-dark/95 px-6 py-4 backdrop-blur-md md:top-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 md:gap-12">
              <button onClick={() => switchMode("photo")} className="group relative pb-2 text-center">
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

              <div className="h-5 w-px bg-gray-warm" />

              <button onClick={() => switchMode("video")} className="group relative pb-2 text-center">
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

            {mode === "photo" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPhotoView("mosaic")}
                  aria-label="Мозаїка"
                  className={`flex h-8 w-8 items-center justify-center transition-colors duration-300 ${
                    photoView === "mosaic" ? "text-wine" : "text-gray-mid hover:text-cream"
                  }`}
                >
                  <Images className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPhotoView("grid")}
                  aria-label="Сітка"
                  className={`flex h-8 w-8 items-center justify-center transition-colors duration-300 ${
                    photoView === "grid" ? "text-wine" : "text-gray-mid hover:text-cream"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${crossfade ? "opacity-0" : "opacity-100"}`}>
        {mode === "photo" && photoView === "mosaic" && (
          <MosaicGrid items={mosaicCatalog} openLightbox={openLightbox} />
        )}

        {mode === "photo" && photoView === "grid" && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <PhotoWorld
              categories={photoCategories}
              activeFilter={photoFilter}
              setActiveFilter={setPhotoFilter}
              items={filteredPhotos}
              openLightbox={openLightbox}
              tabsRef={tabsRef}
            />
          </div>
        )}

        {mode === "video" && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <VideoWorld
              categories={videoCategories}
              activeFilter={videoFilter}
              setActiveFilter={setVideoFilter}
              items={filteredVideos}
              openVideoModal={openVideoModal}
              tabsRef={tabsRef}
            />
          </div>
        )}
      </div>

      {lightbox && displayPhotos[lightbox.index] && (
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
            onClick={(event) => {
              event.stopPropagation()
              navigateLightbox("prev")
            }}
            className="absolute left-4 top-1/2 z-[60] -translate-y-1/2 text-wine/70 transition-colors duration-300 hover:text-wine md:left-8"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={displayPhotos[lightbox.index].fullSrc ?? displayPhotos[lightbox.index].src}
              alt={displayPhotos[lightbox.index].alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation()
              navigateLightbox("next")
            }}
            className="absolute right-4 top-1/2 z-[60] -translate-y-1/2 text-wine/70 transition-colors duration-300 hover:text-wine md:right-8"
            aria-label="Next photo"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-[60] -translate-x-1/2 text-sm tracking-widest text-gray-mid">
            {lightbox.index + 1} / {displayPhotos.length}
          </div>
        </div>
      )}

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

          <div className="aspect-video w-[92vw] max-w-5xl" onClick={(event) => event.stopPropagation()}>
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

function MosaicGrid({
  items,
  openLightbox,
}: {
  items: PhotoItem[]
  openLightbox: (index: number) => void
}) {
  const { t } = useI18n()
  const desktopRows = 8
  const desktopColumns = Math.max(1, Math.ceil(items.length / desktopRows))
  const revealRefs = useMosaicReveal(items.length)

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[calc(100vh-15rem)] lg:gap-[2px] lg:[grid-template-columns:repeat(var(--mosaic-cols),minmax(0,1fr))] lg:[grid-template-rows:repeat(var(--mosaic-rows),minmax(0,1fr))]"
        style={
          {
            "--mosaic-cols": desktopColumns,
            "--mosaic-rows": desktopRows,
          } as Record<string, string | number>
        }
      >
        {items.map((item, itemIndex) => (
          <MosaicCard
            key={item.id}
            item={item}
            itemIndex={itemIndex}
            desktopColumns={desktopColumns}
            openLightbox={openLightbox}
            t={t}
            revealRef={(el) => { revealRefs.current[itemIndex] = el }}
          />
        ))}
      </div>
    </div>
  )
}

function MosaicCard({
  item,
  itemIndex,
  desktopColumns,
  openLightbox,
  t,
  revealRef,
}: {
  item: PhotoItem
  itemIndex: number
  desktopColumns: number
  openLightbox: (index: number) => void
  t: ReturnType<typeof useI18n>["t"]
  revealRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, onMouseMove, onMouseEnter, onMouseLeave } = useCardTilt()
  const isTouchDevice = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches
  const categoryLabel = t.portfolio.categories[item.category as keyof typeof t.portfolio.categories] ?? item.category

  return (
    <div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
        revealRef(el)
      }}
      className="group relative h-[clamp(180px,34vw,280px)] cursor-pointer overflow-hidden rounded-[1rem] border border-white/8 bg-dark-card/60 shadow-[0_12px_32px_rgba(0,0,0,0.18)] mosaic-item lg:h-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none"
      data-col-desktop={itemIndex % desktopColumns}
      data-col-mobile={itemIndex % 2}
      onClick={() => { onMouseLeave(); openLightbox(itemIndex) }}
      onMouseMove={isTouchDevice ? undefined : onMouseMove}
      onMouseEnter={isTouchDevice ? undefined : onMouseEnter}
      onMouseLeave={isTouchDevice ? undefined : onMouseLeave}
    >
      <div className="absolute inset-[4px] overflow-hidden rounded-[calc(1rem-4px)] bg-black sm:inset-[6px] lg:inset-0 lg:rounded-none">
        <img
          src={item.src}
          alt={item.alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
          loading={itemIndex < 24 ? "eager" : "lazy"}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
          aria-hidden="true"
        />
        {/* Category label */}
        <span className="absolute bottom-3 left-3 text-[9px] uppercase tracking-[0.25em] text-cream/90 font-medium translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 pointer-events-none select-none">
          {categoryLabel}
        </span>
      </div>
    </div>
  )
}

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
  tabsRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <>
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

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`group relative cursor-pointer overflow-hidden ${
              item.wide ? "col-span-2" : "col-span-1"
            }`}
            style={{
              animationDelay: `${index * 40}ms`,
              animation: "fadeScaleIn 0.5s ease both",
            }}
            onClick={() => openLightbox(index)}
          >
            <div className={`relative w-full ${item.wide ? "aspect-[16/10]" : "aspect-[3/4]"}`}>
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
              <div className="absolute inset-0 flex items-center justify-center bg-dark/0 transition-all duration-500 group-hover:bg-dark/50">
                <div className="flex flex-col items-center gap-2 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  <Search className="h-5 w-5 text-cream/80" />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-wine">
                    {categories.find((category) => category.id === item.category)?.label}
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
  tabsRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="group cursor-pointer"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: "fadeScaleIn 0.5s ease both",
            }}
            onClick={() => openVideoModal(item)}
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={item.thumbnail}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/30 bg-dark/40 backdrop-blur-sm transition-all duration-400 group-hover:border-wine group-hover:bg-wine/70 group-hover:scale-110 md:h-20 md:w-20">
                  <Play className="h-6 w-6 translate-x-0.5 text-cream md:h-7 md:w-7" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-3 right-3 bg-dark/70 px-2 py-1 text-xs tracking-wide text-cream/80 backdrop-blur-sm">
                {item.duration}
              </div>
            </div>

            <div className="mt-4 flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg font-light text-cream transition-colors duration-300 group-hover:text-wine md:text-xl">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-mid">
                  {categories.find((category) => category.id === item.category)?.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
