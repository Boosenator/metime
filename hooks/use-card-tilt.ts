"use client"
import { useCallback, useRef } from "react"

const MAX_TILT = 7

export function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2
    el.style.transition = "transform 80ms linear"
    el.style.transform = `perspective(600px) rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg) scale3d(1.02,1.02,1.02)`
  }, [])

  const onMouseEnter = useCallback(() => {
    if (ref.current) ref.current.style.willChange = "transform"
  }, [])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = "transform 400ms ease"
    el.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    setTimeout(() => {
      if (ref.current) ref.current.style.willChange = "auto"
    }, 420)
  }, [])

  return { ref, onMouseMove, onMouseEnter, onMouseLeave }
}
