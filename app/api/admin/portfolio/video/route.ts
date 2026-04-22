import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import {
  deletePortfolioVideo,
  readVideos,
  saveVideosData,
} from "@/lib/portfolio/storage"

export async function DELETE(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const videoId = (body as { id?: unknown }).id
  if (typeof videoId !== "string" || videoId.length === 0) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 })
  }

  try {
    const videos = await readVideos()
    const video = videos.find((item) => item.id === videoId)
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const nextVideos = videos.filter((item) => item.id !== videoId)
    await deletePortfolioVideo(video)
    await saveVideosData(nextVideos)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete portfolio video", error)
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 })
  }
}
