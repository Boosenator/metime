import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { PortfolioClient } from "@/components/portfolio-client"
import { Pricing } from "@/components/pricing"
import { Team } from "@/components/team"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ScrollWrapper } from "@/components/scroll-wrapper"
import { I18nProvider } from "@/lib/i18n"
import { getPortfolioVideoSrc } from "@/lib/portfolio/image-src"
import { readPortfolioData } from "@/lib/portfolio/read-data"
import { readPricingData } from "@/lib/pricing/storage"
import { absoluteUrl, buildStudioJsonLd, buildWebsiteJsonLd, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Фото та відеозйомка в Черкасах",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Фото та відеозйомка в Черкасах`,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} portfolio preview`,
      },
    ],
  },
  twitter: {
    title: `${SITE_NAME} | Фото та відеозйомка в Черкасах`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export const dynamic = "force-dynamic"

export default async function Home() {
  const { photos, videos, heroVideos, layout } = await readPortfolioData()
  const pricingData = await readPricingData()
  const activePhotos = photos.filter((photo) => !photo.excluded)
  const activeVideos = videos.filter((video) => !video.excluded)
  const videoMap = new Map(videos.map((video) => [video.id, video]))
  const desktopHeroVideo = heroVideos.desktopVideoId ? videoMap.get(heroVideos.desktopVideoId) ?? null : null
  const mobileHeroVideo = heroVideos.mobileVideoId ? videoMap.get(heroVideos.mobileVideoId) ?? null : null

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
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([buildStudioJsonLd(), buildWebsiteJsonLd()]),
          }}
        />
        <Navigation />
        <main>
          <Hero
            desktopVideoSrc={desktopHeroVideo ? getPortfolioVideoSrc(desktopHeroVideo) : null}
            mobileVideoSrc={mobileHeroVideo ? getPortfolioVideoSrc(mobileHeroVideo) : null}
          />
          <div className="fade-in-section">
            <PortfolioClient cells={cells} grid={layout.grid} photos={activePhotos} videos={activeVideos} />
          </div>
          <div className="fade-in-section">
            <Pricing pricingData={pricingData} />
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
