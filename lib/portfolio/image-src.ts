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

const SITEMAP_CATEGORY_CAPTIONS_UK: Record<string, string> = {
  dance: "Танцювальна зйомка MeTime Studio",
  wedding: "Весільна зйомка MeTime Studio",
  kids: "Дитяча зйомка MeTime Studio",
  brand: "Бренд-зйомка MeTime Studio",
  commercial: "Бренд-зйомка MeTime Studio",
  lovestory: "Love Story MeTime Studio",
  portrait: "Портретна зйомка MeTime Studio",
  custom: "Фотозйомка MeTime Studio",
}

function cleanText(value?: string | null): string | undefined {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function photoToken(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/^[a-z]+-/i, "")
    .replace(/[-_]+/g, " ")
    .trim()
}

export function photoAlt(photo: Pick<PhotoMeta, "filename" | "category" | "alt" | "title" | "caption">): string {
  const manual = cleanText(photo.alt) ?? cleanText(photo.title) ?? cleanText(photo.caption)
  if (manual) return manual

  const category = photo.category ?? photo.filename.toLowerCase().split("-")[0]
  const label = CATEGORY_LABELS_UK[category] ?? "фотозйомка"
  const token = photoToken(photo.filename)
  return token ? `MeTime Studio — ${label}, фото ${token}` : `MeTime Studio — ${label}`
}

export function photoCaption(photo: Pick<PhotoMeta, "filename" | "category" | "caption" | "title" | "alt">): string {
  const manual = cleanText(photo.caption) ?? cleanText(photo.title) ?? cleanText(photo.alt)
  if (manual) return manual

  const category = photo.category ?? photo.filename.toLowerCase().split("-")[0]
  const label = SITEMAP_CATEGORY_CAPTIONS_UK[category] ?? "Фотозйомка MeTime Studio"
  const token = photoToken(photo.filename)
  return token ? `${label}: фото ${token}` : label
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
