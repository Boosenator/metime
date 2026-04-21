import type { PhotoMeta } from "./types"

export function getPortfolioImageSrc(photo: Pick<PhotoMeta, "filename" | "src">): string {
  if (photo.src) return photo.src
  if (/^https?:\/\//i.test(photo.filename)) return photo.filename
  return `/images/portfolio/${photo.filename}`
}
