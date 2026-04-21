import { readPortfolioData } from "@/lib/portfolio/read-data"
import { AdminPortfolioEditor } from "@/components/admin-portfolio-editor"

export const dynamic = "force-dynamic"

export default function AdminPortfolioPage() {
  const { photos, layout } = readPortfolioData()
  return <AdminPortfolioEditor initialPhotos={photos} initialLayout={layout} />
}
