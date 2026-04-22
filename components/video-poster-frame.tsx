"use client"

import { useEffect, useRef } from "react"

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
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

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
  }, [onDurationChange, seekTo, src])

  return (
    <video
      ref={ref}
      src={src}
      className={className}
      preload="metadata"
      muted
      playsInline
    />
  )
}
