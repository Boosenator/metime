import type { PhotoMeta, VideoMeta } from "./types"

const CATEGORY_LABELS_UK: Record<string, string> = {
  dance: "танцювальна зйомка",
  wedding: "весільна зйомка",
  kids: "дитяча зйомка",
  brand: "бренд-зйомка",
  commercial: "бренд-зйомка",
  lovestory: "love story",
  portrait: "портретна зйомка",
  custom: "фотозйомка",
}

export function photoAlt(photo: Pick<PhotoMeta, "filename" | "category">): string {
  const category = photo.category ?? photo.filename.toLowerCase().split("-")[0]
  const label = CATEGORY_LABELS_UK[category] ?? "фотозйомка"
  return `MeTime Studio — ${label}`
}

export function getPortfolioImageSrc(photo: Pick<PhotoMeta, "filename" | "src">): string {
  if (photo.src) return photo.src
  if (/^https?:\/\//i.test(photo.filename)) return photo.filename
  return `/images/portfolio/${photo.filename}`
}

export function getPortfolioVideoSrc(video: Pick<VideoMeta, "filename" | "src">): string {
  if (video.src) return video.src
  if (/^https?:\/\//i.test(video.filename)) return video.filename
  return `/videos/portfolio/${video.filename}`
}
