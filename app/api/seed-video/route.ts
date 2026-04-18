import { list, put } from "@vercel/blob"
import { NextResponse } from "next/server"

/*
 * Два формати відео:
 * - Desktop (16:9): горизонтальне
 * - Mobile (9:16): вертикальне
 *
 * Замініть URL на свої файли коли будуть готові.
 */

// Stock videos (замініть на свої)
const DESKTOP_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
const MOBILE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"

const DESKTOP_FILENAME = "hero-reel-desktop.mp4"
const MOBILE_FILENAME = "hero-reel-mobile.mp4"

async function getOrUploadVideo(
  sourceUrl: string,
  filename: string,
  blobs: { pathname: string; url: string }[]
): Promise<string | null> {
  const existing = blobs.find((b) => b.pathname === filename)
  if (existing) {
    return existing.url
  }

  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) return null

    const videoBuffer = await response.arrayBuffer()
    const blob = await put(filename, videoBuffer, {
      access: "public",
      contentType: "video/mp4",
    })
    return blob.url
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const { blobs } = await list()

    const [desktopUrl, mobileUrl] = await Promise.all([
      getOrUploadVideo(DESKTOP_VIDEO_URL, DESKTOP_FILENAME, blobs),
      getOrUploadVideo(MOBILE_VIDEO_URL, MOBILE_FILENAME, blobs),
    ])

    return NextResponse.json({
      desktop: desktopUrl,
      mobile: mobileUrl,
      success: true,
    })
  } catch (error) {
    console.error("Seed video error:", error)
    return NextResponse.json(
      { error: "Failed to seed video" },
      { status: 500 }
    )
  }
}
