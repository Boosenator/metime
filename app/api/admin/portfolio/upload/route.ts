import { createHash } from "crypto"
import { NextResponse } from "next/server"
import sharp from "sharp"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readPhotos, savePhotosData, savePortfolioImage } from "@/lib/portfolio/storage"
import type { PhotoMeta } from "@/lib/portfolio/types"
import { rgbToLab, hexFromRgb } from "@/lib/portfolio/color-utils"

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const formData = await request.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
  }

  const existing: PhotoMeta[] = await readPhotos()

  const added: PhotoMeta[] = []

  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 16)
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const filename = `${hash}.${ext}`

      const image = sharp(buffer)
      const meta = await image.metadata()

      const { data, info } = await image
        .resize(32, 32, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true })

      let rSum = 0, gSum = 0, bSum = 0
      const pixels = info.width * info.height
      for (let i = 0; i < data.length; i += info.channels) {
        rSum += data[i]
        gSum += data[i + 1]
        bSum += data[i + 2]
      }
      const r = rSum / pixels
      const g = gSum / pixels
      const b = bSum / pixels

      const src = await savePortfolioImage(filename, buffer, file.type)
      const photo: PhotoMeta = {
        id: hash,
        filename,
        ...(src ? { src } : {}),
        category: "custom",
        excluded: false,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        dominantColor: hexFromRgb(r, g, b),
        lab: rgbToLab(r, g, b),
        uploadedAt: new Date().toISOString(),
      }

      const existingIndex = existing.findIndex((p) => p.id === photo.id)
      if (existingIndex === -1) {
        existing.push(photo)
        added.push(photo)
      } else if (src && !existing[existingIndex].src) {
        existing[existingIndex] = { ...existing[existingIndex], src }
      }
    }

    await savePhotosData(existing)
    return NextResponse.json({ ok: true, added })
  } catch (error) {
    console.error("Failed to upload portfolio files", error)
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    )
  }
}
