"use client"
import { useEffect, useRef } from "react"

export function useMosaicReveal(itemCount: number) {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const isMobile = window.innerWidth < 1024
          const col = Number(isMobile ? el.dataset.colMobile : el.dataset.colDesktop) || 0
          el.style.animationDelay = `${col * 55}ms`
          el.classList.add("mosaic-revealed")
          observer.unobserve(el)
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    )
    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [itemCount])

  return refs
}
