import { existsSync, mkdirSync, readFileSync } from "fs"
import { readFile, unlink, writeFile } from "fs/promises"
import { join } from "path"
import { del, get, put } from "@vercel/blob"
import { arrangeByColor } from "./arrange-by-color"
import type { GridConfig, LayoutData, PhotoMeta } from "./types"

const PORTFOLIO_DIR = join(process.cwd(), "data", "portfolio")
const PHOTOS_DIR = join(process.cwd(), "public", "images", "portfolio")
const PHOTOS_JSON = join(PORTFOLIO_DIR, "photos.json")
const LAYOUT_JSON = join(PORTFOLIO_DIR, "layout.json")

const BLOB_PHOTOS_JSON = "portfolio/photos.json"
const BLOB_LAYOUT_JSON = "portfolio/layout.json"
const BLOB_IMAGE_PREFIX = "portfolio/images"

const DEFAULT_GRID: GridConfig = { cols: 12, rows: 24 }

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const blob = await get(pathname, { access: "public" })
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null

    const response = new Response(blob.stream)
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function writeBlobJson(pathname: string, data: unknown) {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  })
}

function readLocalJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return null
  }
}

function ensureLocalDirs() {
  mkdirSync(PORTFOLIO_DIR, { recursive: true })
  mkdirSync(PHOTOS_DIR, { recursive: true })
}

function mergePhotoRecords(blobPhotos: PhotoMeta[], localPhotos: PhotoMeta[]) {
  const localById = new Map(localPhotos.map((photo) => [photo.id, photo]))
  const localByFilename = new Map(localPhotos.map((photo) => [photo.filename, photo]))

  return blobPhotos.map((photo) => {
    const fallback = localById.get(photo.id) ?? localByFilename.get(photo.filename)
    if (!fallback) return photo

    return {
      ...fallback,
      ...photo,
      src: photo.src || fallback.src,
    }
  })
}

export async function readPhotos(): Promise<PhotoMeta[]> {
  const localPhotos = readLocalJson<PhotoMeta[]>(PHOTOS_JSON) ?? []

  if (useBlobStorage()) {
    const photos = await readBlobJson<PhotoMeta[]>(BLOB_PHOTOS_JSON)
    if (photos) return mergePhotoRecords(photos, localPhotos)
  }

  return localPhotos
}

export async function readLayout(photos: PhotoMeta[]): Promise<LayoutData> {
  if (useBlobStorage()) {
    const layout = await readBlobJson<LayoutData>(BLOB_LAYOUT_JSON)
    if (
      layout &&
      typeof layout.grid?.cols === "number" &&
      typeof layout.grid?.rows === "number" &&
      Array.isArray(layout.cells)
    ) {
      return layout
    }
  }

  const localLayout = readLocalJson<LayoutData>(LAYOUT_JSON)
  if (
    localLayout &&
    typeof localLayout.grid?.cols === "number" &&
    typeof localLayout.grid?.rows === "number" &&
    Array.isArray(localLayout.cells)
  ) {
    return localLayout
  }

  return {
    grid: DEFAULT_GRID,
    cells: arrangeByColor(photos.filter((photo) => !photo.excluded), DEFAULT_GRID),
    version: 1,
    updatedAt: new Date().toISOString(),
  }
}

export async function readPortfolioData(): Promise<{ photos: PhotoMeta[]; layout: LayoutData }> {
  const photos = await readPhotos()
  const layout = await readLayout(photos)
  return { photos, layout }
}

export async function saveLayoutData(layout: LayoutData) {
  if (useBlobStorage()) {
    await writeBlobJson(BLOB_LAYOUT_JSON, layout)
    return
  }

  ensureLocalDirs()
  await writeFile(LAYOUT_JSON, JSON.stringify(layout, null, 2), "utf8")
}

export async function savePhotosData(photos: PhotoMeta[]) {
  if (useBlobStorage()) {
    await writeBlobJson(BLOB_PHOTOS_JSON, photos)
    return
  }

  ensureLocalDirs()
  await writeFile(PHOTOS_JSON, JSON.stringify(photos, null, 2), "utf8")
}

export async function savePortfolioImage(filename: string, buffer: Buffer, contentType?: string) {
  if (useBlobStorage()) {
    const uploaded = await put(`${BLOB_IMAGE_PREFIX}/${filename}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType || undefined,
    })
    return uploaded.url
  }

  ensureLocalDirs()
  const destPath = join(PHOTOS_DIR, filename)
  if (!existsSync(destPath)) {
    await writeFile(destPath, buffer)
  }
  return null
}

export async function readLocalPhotoBuffer(filename: string) {
  const localPath = join(PHOTOS_DIR, filename)
  if (!existsSync(localPath)) return null
  return readFile(localPath)
}

export async function deletePortfolioImage(photo: Pick<PhotoMeta, "filename" | "src">) {
  if (useBlobStorage()) {
    await del(photo.src || `${BLOB_IMAGE_PREFIX}/${photo.filename}`)
    return
  }

  const localPath = join(PHOTOS_DIR, photo.filename)
  if (!existsSync(localPath)) return
  await unlink(localPath)
}
