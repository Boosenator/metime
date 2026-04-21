import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { PortfolioClient } from "@/components/portfolio-client"
import { Pricing } from "@/components/pricing"
import { Team } from "@/components/team"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ScrollWrapper } from "@/components/scroll-wrapper"
import { I18nProvider } from "@/lib/i18n"
import { getHeroVideoAvailability } from "@/lib/get-hero-video-availability"
import { readPortfolioData } from "@/lib/portfolio/read-data"

export const dynamic = "force-dynamic"

export default async function Home() {
  const heroVideoAvailability = getHeroVideoAvailability()
  const { photos, layout } = await readPortfolioData()
  const activePhotos = photos.filter((photo) => !photo.excluded)

  const photoMap = new Map(activePhotos.map((p) => [p.id, p]))
  const cells = layout.cells
    .map((cell) => {
      const photo = photoMap.get(cell.photoId)
      if (!photo) return null
      return { ...cell, photo }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  return (
    <I18nProvider>
      <ScrollWrapper>
        <Navigation />
        <main>
          <Hero {...heroVideoAvailability} />
          <div className="fade-in-section">
            <PortfolioClient cells={cells} grid={layout.grid} photos={activePhotos} />
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
      </ScrollWrapper>
    </I18nProvider>
  )
}
