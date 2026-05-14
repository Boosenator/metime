import { readBlogPosts } from "./storage"
import { OG_IMAGE } from "@/lib/seo"

const CATEGORY_PREFIXES: Record<string, string[]> = {
  wedding: ["wedding"],
  dance: ["dance"],
  kids: ["kids"],
  brand: ["brand", "commercial"],
  lovestory: ["lovestory"],
  portrait: ["portrait"],
}

export async function getPostOgImage(category?: string): Promise<string> {
  try {
    const { readPortfolioData } = await import("@/lib/portfolio/read-data")
    const { photos } = await readPortfolioData()
    const landscape = photos.filter((p) => !p.excluded && p.width > p.height && p.src)

    if (category && CATEGORY_PREFIXES[category]) {
      const prefixes = CATEGORY_PREFIXES[category]
      const match = landscape.find((p) =>
        prefixes.some(
          (prefix) =>
            p.category === prefix || p.filename.toLowerCase().startsWith(prefix + "-")
        )
      )
      if (match?.src) return match.src
    }

    if (landscape[0]?.src) return landscape[0].src
  } catch {}

  return OG_IMAGE
}

export { readBlogPosts }
