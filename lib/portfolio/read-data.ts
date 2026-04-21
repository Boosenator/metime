import { existsSync, readFileSync } from "fs"
import { join } from "path"
import type { PhotoMeta, LayoutData, GridConfig } from "./types"
import { arrangeByColor } from "./arrange-by-color"

const PHOTOS_JSON = join(process.cwd(), "data", "portfolio", "photos.json")
const LAYOUT_JSON = join(process.cwd(), "data", "portfolio", "layout.json")

const DEFAULT_GRID: GridConfig = { cols: 12, rows: 24 }

export function readPhotos(): PhotoMeta[] {
  if (!existsSync(PHOTOS_JSON)) return []
  try {
    return JSON.parse(readFileSync(PHOTOS_JSON, "utf8")) as PhotoMeta[]
  } catch {
    return []
  }
}

export function readLayout(photos: PhotoMeta[]): LayoutData {
  if (existsSync(LAYOUT_JSON)) {
    try {
      const parsed = JSON.parse(readFileSync(LAYOUT_JSON, "utf8")) as LayoutData
      if (
        typeof parsed.grid?.cols === "number" &&
        typeof parsed.grid?.rows === "number" &&
        Array.isArray(parsed.cells)
      ) {
        return parsed
      }
    } catch {
      // fall through to auto-generate
    }
  }

  const cells = arrangeByColor(photos, DEFAULT_GRID)
  return {
    grid: DEFAULT_GRID,
    cells,
    version: 1,
    updatedAt: new Date().toISOString(),
  }
}

export function readPortfolioData(): { photos: PhotoMeta[]; layout: LayoutData } {
  const photos = readPhotos()
  const layout = readLayout(photos)
  return { photos, layout }
}
