import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Pricing } from "@/components/pricing"
import { Team } from "@/components/team"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ScrollWrapper } from "@/components/scroll-wrapper"
import { I18nProvider } from "@/lib/i18n"
import { getHeroVideoAvailability } from "@/lib/get-hero-video-availability"

export default async function Home() {
  const heroVideoAvailability = getHeroVideoAvailability()

  return (
    <I18nProvider>
      <ScrollWrapper>
        <Navigation />
        <main>
          <Hero {...heroVideoAvailability} />
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
