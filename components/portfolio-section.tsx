import { PortfolioMosaic } from "@/components/portfolio-mosaic"
import type { Cell, GridConfig, PhotoMeta } from "@/lib/portfolio/types"

type PopulatedCell = Cell & { photo: PhotoMeta }

export function PortfolioSection({
  cells,
  grid,
}: {
  cells: PopulatedCell[]
  grid: GridConfig
}) {
  return (
    <section id="portfolio" className="bg-dark py-16 lg:py-20">
      <div className="mb-10 px-6 text-center lg:px-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">Портфоліо</p>
        <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl text-balance">
          MiTime Studio
        </h2>
      </div>
      <PortfolioMosaic cells={cells} grid={grid} />
    </section>
  )
}
