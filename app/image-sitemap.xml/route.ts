import { readPortfolioData } from "@/lib/portfolio/read-data"
import { getPortfolioImageSrc } from "@/lib/portfolio/image-src"
import { absoluteUrl, SITE_URL } from "@/lib/seo"

export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  dance: "Танцювальна зйомка MeTime Studio",
  wedding: "Весільна зйомка MeTime Studio",
  kids: "Дитяча зйомка MeTime Studio",
  brand: "Бренд-зйомка MeTime Studio",
  commercial: "Бренд-зйомка MeTime Studio",
  lovestory: "Love Story MeTime Studio",
  portrait: "Портретна зйомка MeTime Studio",
  custom: "Фотозйомка MeTime Studio",
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function GET() {
  const { photos } = await readPortfolioData()
  const active = photos.filter((p) => !p.excluded && (p.src || p.filename))

  const imageBlocks = active
    .map((photo) => {
      const src = getPortfolioImageSrc(photo)
      const imgUrl = src.startsWith("http") ? src : absoluteUrl(src)
      const caption = CATEGORY_LABELS[photo.category ?? "custom"] ?? "Фотозйомка MeTime Studio"
      return `    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:caption>${escapeXml(caption)}</image:caption>
    </image:image>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/portfolio</loc>
${imageBlocks}
  </url>
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
