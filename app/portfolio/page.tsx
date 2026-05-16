import type { Metadata } from "next"
import { readPortfolioData } from "@/lib/portfolio/read-data"
import { PortfolioMosaic } from "@/components/portfolio-mosaic"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"
import { absoluteUrl, buildBreadcrumbJsonLd, buildPortfolioJsonLd, OG_IMAGE_PORTFOLIO, SITE_NAME } from "@/lib/seo"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const { photos } = await readPortfolioData()
  const count = photos.filter((p) => !p.excluded).length
  return {
    title: "Портфоліо",
    description: `Портфоліо MeTime Studio — ${count}+ робіт з весільної, танцювальної, дитячої та портретної зйомки у Черкасах.`,
    alternates: {
      canonical: "/portfolio",
    },
    openGraph: {
      title: `Портфоліо | ${SITE_NAME}`,
      description: `${count}+ фотоісторій MeTime Studio: весілля, танці, діти, портрет, бренд-зйомка у Черкасах.`,
      url: absoluteUrl("/portfolio"),
      images: [
        {
          url: OG_IMAGE_PORTFOLIO,
          width: 1920,
          height: 1280,
          alt: `${SITE_NAME} — портфоліо фотографій`,
        },
      ],
    },
  }
}

export default async function PortfolioPage() {
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
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildPortfolioJsonLd(activePhotos.length),
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: "Портфоліо", url: "/portfolio" },
            ]),
          ]),
        }}
      />
      <Navigation />
      <main className="page-main pt-24 md:pt-28">
        <div className="page-container page-hero text-center">
          <p className="page-eyebrow">MeTime Studio</p>
          <h1 className="page-title">Портфоліо фото та відеозйомки</h1>
        </div>
        <PortfolioMosaic cells={cells} grid={layout.grid} />
      </main>
      <Footer />
    </I18nProvider>
  )
}
