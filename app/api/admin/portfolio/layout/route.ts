import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { saveLayoutData, savePhotosData } from "@/lib/portfolio/storage"
import type { LayoutData, PhotoMeta } from "@/lib/portfolio/types"

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const payload = body as Partial<LayoutData>
  if (
    typeof payload.grid?.cols !== "number" ||
    typeof payload.grid?.rows !== "number" ||
    !Array.isArray(payload.cells)
  ) {
    return NextResponse.json({ error: "Invalid layout payload" }, { status: 400 })
  }

  const validated: LayoutData = {
    grid: {
      cols: Math.max(1, Math.min(40, Math.floor(payload.grid.cols))),
      rows: Math.max(1, Math.min(40, Math.floor(payload.grid.rows))),
    },
    cells: payload.cells
      .filter(
        (c) =>
          c &&
          typeof c.photoId === "string" &&
          typeof c.x === "number" &&
          typeof c.y === "number" &&
          typeof c.spanX === "number" &&
          typeof c.spanY === "number"
      )
      .map((c) => ({
        photoId: c.photoId,
        x: Math.max(0, Math.floor(c.x)),
        y: Math.max(0, Math.floor(c.y)),
        spanX: Math.max(1, Math.floor(c.spanX)),
        spanY: Math.max(1, Math.floor(c.spanY)),
        locked: Boolean(c.locked),
      })),
    version: typeof payload.version === "number" ? payload.version + 1 : 1,
    updatedAt: new Date().toISOString(),
  }

  const bodyWithPhotos = body as { photos?: unknown[] }
  const validatedPhotos = Array.isArray(bodyWithPhotos.photos)
    ? bodyWithPhotos.photos
        .filter(
          (photo): photo is PhotoMeta =>
            Boolean(photo) &&
            typeof photo.id === "string" &&
            typeof photo.filename === "string" &&
            typeof photo.width === "number" &&
            typeof photo.height === "number" &&
            typeof photo.dominantColor === "string" &&
            typeof photo.uploadedAt === "string" &&
            typeof photo.lab?.L === "number" &&
            typeof photo.lab?.a === "number" &&
            typeof photo.lab?.b === "number"
        )
        .map((photo) => ({
          ...photo,
          category: typeof photo.category === "string" ? photo.category : "custom",
          excluded: Boolean(photo.excluded),
        }))
    : null

  try {
    if (validatedPhotos) {
      await savePhotosData(validatedPhotos)
    }
    await saveLayoutData(validated)
    return NextResponse.json({ ok: true, cells: validated.cells.length })
  } catch (error) {
    console.error("Failed to save portfolio layout", error)
    return NextResponse.json(
      { error: "Failed to save layout" },
      { status: 500 }
    )
  }
}
