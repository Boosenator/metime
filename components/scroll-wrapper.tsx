"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function ScrollWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useScrollAnimation()
  return <div ref={containerRef}>{children}</div>
}
