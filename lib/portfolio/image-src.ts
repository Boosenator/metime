import type { PhotoMeta, VideoMeta } from "./types"

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
