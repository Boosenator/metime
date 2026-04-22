import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readVideos, savePortfolioVideo, saveVideosData } from "@/lib/portfolio/storage"
import type { VideoMeta } from "@/lib/portfolio/types"

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const formData = await request.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) {
    return NextResponse.json({ error: "No videos uploaded" }, { status: 400 })
  }

  const existing: VideoMeta[] = await readVideos()
  const added: VideoMeta[] = []

  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 16)
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4"
      const filename = `${hash}.${ext}`

      const src = await savePortfolioVideo(filename, buffer, file.type)
      const video: VideoMeta = {
        id: hash,
        filename,
        ...(src ? { src } : {}),
        category: "custom",
        excluded: false,
        title: file.name.replace(/\.[^.]+$/, ""),
        mimeType: file.type || undefined,
        uploadedAt: new Date().toISOString(),
      }

      const existingIndex = existing.findIndex((item) => item.id === video.id)
      if (existingIndex === -1) {
        existing.push(video)
        added.push(video)
      } else if (src && !existing[existingIndex].src) {
        existing[existingIndex] = { ...existing[existingIndex], src }
      }
    }

    await saveVideosData(existing)
    return NextResponse.json({ ok: true, added })
  } catch (error) {
    console.error("Failed to upload portfolio videos", error)
    return NextResponse.json({ error: "Failed to upload videos" }, { status: 500 })
  }
}
