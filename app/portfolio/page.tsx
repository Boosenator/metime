import { readPortfolioData } from "@/lib/portfolio/read-data"
import { PortfolioMosaic } from "@/components/portfolio-mosaic"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { I18nProvider } from "@/lib/i18n"

export const dynamic = "force-dynamic"

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
      <Navigation />
      <main className="min-h-screen bg-dark pt-16">
        <div className="px-4 py-10 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-wine">Портфоліо</p>
          <h1 className="font-serif text-4xl font-light text-cream md:text-6xl">MiTime Studio</h1>
        </div>
        <PortfolioMosaic cells={cells} grid={layout.grid} />
      </main>
      <Footer />
    </I18nProvider>
  )
}
