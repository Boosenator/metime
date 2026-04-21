import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import {
  deletePortfolioImage,
  readLayout,
  readPhotos,
  saveLayoutData,
  savePhotosData,
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

  const photoId = (body as { id?: unknown }).id
  if (typeof photoId !== "string" || photoId.length === 0) {
    return NextResponse.json({ error: "Missing photo id" }, { status: 400 })
  }

  try {
    const photos = await readPhotos()
    const photo = photos.find((item) => item.id === photoId)
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const nextPhotos = photos.filter((item) => item.id !== photoId)
    const layout = await readLayout(nextPhotos)
    const nextLayout = {
      ...layout,
      cells: layout.cells.filter((cell) => cell.photoId !== photoId),
      version: layout.version + 1,
      updatedAt: new Date().toISOString(),
    }

    await deletePortfolioImage(photo)
    await savePhotosData(nextPhotos)
    await saveLayoutData(nextLayout)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete portfolio photo", error)
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}
