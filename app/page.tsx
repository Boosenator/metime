"use client"

import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Portfolio } from "@/components/portfolio"
import { Pricing } from "@/components/pricing"
import { Team } from "@/components/team"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { I18nProvider } from "@/lib/i18n"

export default function Home() {
  const containerRef = useScrollAnimation()

  return (
    <I18nProvider>
      <div ref={containerRef}>
        <Navigation />
        <main>
          <Hero />
          <div className="fade-in-section">
            <Portfolio />
          </div>
          <div className="fade-in-section">
            <Pricing />
          </div>
          <div className="fade-in-section">
            <Team />
          </div>
          <div className="fade-in-section">
            <Contact />
          </div>
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
