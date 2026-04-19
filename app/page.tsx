import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Portfolio } from "@/components/portfolio"
import { Pricing } from "@/components/pricing"
import { Team } from "@/components/team"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ScrollWrapper } from "@/components/scroll-wrapper"
import { I18nProvider } from "@/lib/i18n"
import { getPortfolioPhotos } from "@/lib/get-portfolio-photos"

export default function Home() {
  const mosaicImages = getPortfolioPhotos()

  return (
    <I18nProvider>
      <ScrollWrapper>
        <Navigation />
        <main>
          <Hero />
          <div className="fade-in-section">
            <Portfolio mosaicImages={mosaicImages} />
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
