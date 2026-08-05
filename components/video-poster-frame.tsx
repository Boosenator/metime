"use client"

import { useEffect, useRef, useState } from "react"

export function VideoPosterFrame({
  src,
  seekTo = 0,
  className,
  onDurationChange,
}: {
  src: string
  seekTo?: number
  className?: string
  onDurationChange?: (duration: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)

  // Grid pages render one of these per video (16+ on the homepage). Mounting
  // every <video> eagerly meant every offscreen tile also fetched metadata
  // and seeked to its poster frame on first load. Only mount the element
  // (and trigger its network request) once the tile is near the viewport.
  useEffect(() => {
    if (inView) return
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: "300px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !inView) return

    const syncFrame = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      onDurationChange?.(duration)

      const maxSeek = duration > 0 ? Math.max(0, duration - 0.1) : 0
      const nextTime = Math.max(0, Math.min(seekTo, maxSeek))

      try {
        video.pause()
        video.currentTime = nextTime
      } catch {}
    }

    const handleLoadedMetadata = () => {
      syncFrame()
    }

    const handleSeeked = () => {
      video.pause()
    }

    if (video.readyState >= 1) {
      syncFrame()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("seeked", handleSeeked)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("seeked", handleSeeked)
    }
  }, [inView, onDurationChange, seekTo, src])

  return (
    <div ref={containerRef} className={className}>
      {inView && (
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
      )}
    </div>
  )
}
