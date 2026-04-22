import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readVideos, savePortfolioVideo, saveVideosData } from "@/lib/portfolio/storage"
import type { VideoMeta } from "@/lib/portfolio/types"

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video uploaded" }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 16)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4"
    const filename = `${hash}.${ext}`

    const videos = await readVideos()
    const src = await savePortfolioVideo(filename, buffer, file.type)
    const existingIndex = videos.findIndex((item) => item.id === hash)

    const video: VideoMeta = existingIndex === -1
      ? {
          id: hash,
          filename,
          ...(src ? { src } : {}),
          category: "custom",
          excluded: false,
          title: file.name.replace(/\.[^.]+$/, ""),
          mimeType: file.type || undefined,
          uploadedAt: new Date().toISOString(),
        }
      : {
          ...videos[existingIndex],
          ...(src && !videos[existingIndex].src ? { src } : {}),
        }

    const nextVideos =
      existingIndex === -1
        ? [...videos, video]
        : videos.map((item, index) => (index === existingIndex ? video : item))

    await saveVideosData(nextVideos)
    return NextResponse.json({ ok: true, video })
  } catch (error) {
    console.error("Failed to upload hero video", error)
    return NextResponse.json({ error: "Failed to upload hero video" }, { status: 500 })
  }
}
