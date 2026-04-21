import { writeFile, readFile } from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { createHash } from "crypto"
import { NextResponse } from "next/server"
import sharp from "sharp"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import type { PhotoMeta } from "@/lib/portfolio/types"
import { rgbToLab, hexFromRgb } from "@/lib/portfolio/color-utils"

const PHOTOS_DIR = join(process.cwd(), "public", "images", "portfolio")
const PHOTOS_JSON = join(process.cwd(), "data", "portfolio", "photos.json")

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const formData = await request.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
  }

  mkdirSync(PHOTOS_DIR, { recursive: true })
  mkdirSync(join(process.cwd(), "data", "portfolio"), { recursive: true })

  const existing: PhotoMeta[] = existsSync(PHOTOS_JSON)
    ? JSON.parse(await readFile(PHOTOS_JSON, "utf8"))
    : []

  const added: PhotoMeta[] = []

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 16)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const filename = `${hash}.${ext}`
    const destPath = join(PHOTOS_DIR, filename)

    if (!existsSync(destPath)) {
      await writeFile(destPath, buffer)
    }

    const image = sharp(buffer)
    const meta = await image.metadata()

    const { data, info } = await image
      .resize(32, 32, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true })

    let rSum = 0, gSum = 0, bSum = 0
    const pixels = info.width * info.height
    for (let i = 0; i < data.length; i += info.channels) {
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]
    }
    const r = rSum / pixels, g = gSum / pixels, b = bSum / pixels

    const photo: PhotoMeta = {
      id: hash,
      filename,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      dominantColor: hexFromRgb(r, g, b),
      lab: rgbToLab(r, g, b),
      uploadedAt: new Date().toISOString(),
    }

    if (!existing.some((p) => p.id === photo.id)) {
      existing.push(photo)
      added.push(photo)
    }
  }

  await writeFile(PHOTOS_JSON, JSON.stringify(existing, null, 2), "utf8")
  return NextResponse.json({ ok: true, added })
}
