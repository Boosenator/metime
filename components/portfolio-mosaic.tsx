"use client"

import { useState, useCallback, useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Cell, GridConfig, PhotoMeta } from "@/lib/portfolio/types"
import { useCardTilt } from "@/hooks/use-card-tilt"

type PopulatedCell = Cell & { photo: PhotoMeta }

function MosaicCell({
  cell,
  index,
  onClick,
}: {
  cell: PopulatedCell
  index: number
  onClick: () => void
}) {
  const { ref, onMouseMove, onMouseEnter, onMouseLeave } = useCardTilt()

  const src = `/images/portfolio/${cell.photo.filename}`
  const mobileH =
    cell.spanY > 1
      ? `clamp(${180 * cell.spanY}px, ${34 * cell.spanY}vw, ${280 * cell.spanY}px)`
      : "clamp(180px,34vw,280px)"

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="mosaic-cell group relative cursor-pointer overflow-hidden rounded-[1rem] border border-white/8 bg-dark-card/60 shadow-[0_12px_32px_rgba(0,0,0,0.18)] lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none"
      style={
        {
          height: mobileH,
          "--cell-col": `${cell.x + 1} / span ${cell.spanX}`,
          "--cell-row": `${cell.y + 1} / span ${cell.spanY}`,
        } as CSSProperties
      }
      onClick={() => { onMouseLeave(); onClick() }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute inset-[4px] overflow-hidden rounded-[calc(1rem-4px)] bg-black sm:inset-[6px] lg:inset-0 lg:rounded-none">
        <img
          src={src}
          alt={cell.photo.filename}
          className="absolute inset-0 h-full w-full object-cover opacity-45 blur-xl scale-110 transition-transform duration-300 group-hover:scale-[1.14]"
          loading={index < 24 ? "eager" : "lazy"}
          aria-hidden="true"
        />
        <img
          src={src}
          alt={cell.photo.filename}
          className="relative z-[1] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading={index < 24 ? "eager" : "lazy"}
        />
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-black/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export function PortfolioMosaic({
  cells,
  grid,
}: {
  cells: PopulatedCell[]
  grid: GridConfig
}) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const close = useCallback(() => {
    setLightbox(null)
    document.body.style.overflow = ""
  }, [])

  const open = useCallback((i: number) => {
    setLightbox(i)
    document.body.style.overflow = "hidden"
  }, [])

  const navigate = useCallback(
    (dir: "prev" | "next") => {
      if (lightbox === null) return
      const len = cells.length
      setLightbox(dir === "next" ? (lightbox + 1) % len : (lightbox - 1 + len) % len)
    },
    [lightbox, cells.length]
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      if (lightbox !== null) {
        if (e.key === "ArrowLeft") navigate("prev")
        if (e.key === "ArrowRight") navigate("next")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, close, navigate])

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .mosaic-grid {
            grid-template-columns: repeat(${grid.cols}, minmax(0, 1fr));
            grid-template-rows: repeat(${grid.rows}, minmax(120px, auto));
          }
        }
      `}</style>
      {/* Mosaic grid */}
      <div className="mosaic-grid grid grid-cols-2 gap-3 px-4 sm:gap-4 lg:gap-[2px] lg:px-6">
        {cells.map((cell, i) => (
          <MosaicCell key={cell.photoId} cell={cell} index={i} onClick={() => open(i)} />
        ))}
      </div>

      {/* Lightbox — portal to body to escape ancestor transforms */}
      {lightbox !== null && cells[lightbox] && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-6 top-6 text-cream hover:text-wine transition-colors"
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); navigate("prev") }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-wine/70 hover:text-wine transition-colors md:left-8"
            aria-label="Previous"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div
            className="relative h-[80vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/images/portfolio/${cells[lightbox].photo.filename}`}
              alt={cells[lightbox].photo.filename}
              className="h-full w-full object-contain"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); navigate("next") }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-wine/70 hover:text-wine transition-colors md:right-8"
            aria-label="Next"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-widest text-gray-mid">
            {lightbox + 1} / {cells.length}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
