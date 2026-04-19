import { readdirSync } from "fs"
import path from "path"

/**
 * Reads the portfolio images directory at build time.
 * Returns relative URL paths (e.g. "/images/portfolio/dance-1.jpg").
 * Excludes video thumbnails (files starting with "video-").
 */
export function getPortfolioPhotos(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "images", "portfolio")
    return readdirSync(dir)
      .filter(
        (f) =>
          /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("video-")
      )
      .sort()
      .map((f) => "/images/portfolio/" + encodeURIComponent(f))
  } catch {
    return []
  }
}
