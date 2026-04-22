import type { Metadata } from "next"
import { readPortfolioData } from "@/lib/portfolio/read-data"
import { AdminPortfolioEditor } from "@/components/admin-portfolio-editor"

export const metadata: Metadata = {
  title: "Admin Portfolio",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export const dynamic = "force-dynamic"

export default async function AdminPortfolioPage() {
  const { photos, videos, heroVideos, layout } = await readPortfolioData()
  return <AdminPortfolioEditor initialPhotos={photos} initialVideos={videos} initialHeroVideos={heroVideos} initialLayout={layout} />
}
