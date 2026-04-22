import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readVideos, saveVideosData } from "@/lib/portfolio/storage"
import type { VideoMeta } from "@/lib/portfolio/types"

type UploadedBlobPayload = {
  url?: unknown
  pathname?: unknown
  contentType?: unknown
  title?: unknown
}

function buildVideoMeta(payload: UploadedBlobPayload): VideoMeta | null {
  if (typeof payload.url !== "string" || typeof payload.pathname !== "string") {
    return null
  }

  const pathname = payload.pathname
  if (!pathname.startsWith("portfolio/videos/")) {
    return null
  }

  const filename = pathname.split("/").pop()
  if (!filename) return null

  const id = createHash("sha1").update(pathname).digest("hex").slice(0, 16)

  return {
    id,
    filename,
    src: payload.url,
    category: "custom",
    excluded: false,
    title: typeof payload.title === "string" && payload.title.trim().length > 0 ? payload.title.trim() : filename.replace(/\.[^.]+$/, ""),
    posterTime: 0,
    mimeType: typeof payload.contentType === "string" ? payload.contentType : undefined,
    uploadedAt: new Date().toISOString(),
  }
}

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  let body: UploadedBlobPayload
  try {
    body = (await request.json()) as UploadedBlobPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const video = buildVideoMeta(body)
  if (!video) {
    return NextResponse.json({ error: "Invalid uploaded blob payload" }, { status: 400 })
  }

  try {
    const existing = await readVideos()
    const existingIndex = existing.findIndex((item) => item.src === video.src || item.filename === video.filename)

    if (existingIndex === -1) {
      const next = [...existing, video]
      await saveVideosData(next)
      return NextResponse.json({ ok: true, video })
    }

    const merged: VideoMeta = {
      ...existing[existingIndex],
      src: existing[existingIndex].src || video.src,
      mimeType: existing[existingIndex].mimeType || video.mimeType,
      title: existing[existingIndex].title || video.title,
    }

    const next = existing.map((item, index) => (index === existingIndex ? merged : item))
    await saveVideosData(next)
    return NextResponse.json({ ok: true, video: merged })
  } catch (error) {
    console.error("Failed to register hero video", error)
    return NextResponse.json({ error: "Failed to save hero video" }, { status: 500 })
  }
}
