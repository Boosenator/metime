/**
 * Seed /data/portfolio/photos.json from existing images in /public/images/portfolio/
 * Computes dominant color and Lab values via Sharp.
 * Run once: node scripts/seed-portfolio.mjs
 */
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { createHash } from "crypto"
import sharp from "sharp"

const PHOTOS_DIR = join(process.cwd(), "public", "images", "portfolio")
const DATA_DIR = join(process.cwd(), "data", "portfolio")
const PHOTOS_JSON = join(DATA_DIR, "photos.json")

function rgbToLab(r, g, b) {
  let rr = r / 255, gg = g / 255, bb = b / 255
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92

  const x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047
  const y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) / 1.0
  const z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883

  const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116
  const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116
  const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116

  return {
    L: Math.round((116 * fy - 16) * 10) / 10,
    a: Math.round((500 * (fx - fy)) * 10) / 10,
    b: Math.round((200 * (fy - fz)) * 10) / 10,
  }
}

function hexFromRgb(r, g, b) {
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("")
}

function stableId(filename) {
  return createHash("sha1").update(filename).digest("hex").slice(0, 16)
}

async function processPhoto(filename) {
  const path = join(PHOTOS_DIR, filename)
  const image = sharp(path)
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
  const r = rSum / pixels, g = gSum / pixels, b = bSum / pixels
  const dominantColor = hexFromRgb(r, g, b)
  const lab = rgbToLab(r, g, b)

  return {
    id: stableId(filename),
    filename,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    dominantColor,
    lab,
    uploadedAt: new Date().toISOString(),
  }
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true })

  const existing = existsSync(PHOTOS_JSON)
    ? JSON.parse(readFileSync(PHOTOS_JSON, "utf8"))
    : []
  const existingMap = new Map(existing.map(p => [p.filename, p]))

  const files = readdirSync(PHOTOS_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .filter(f => !/^video-/i.test(f))
    .filter(f => f !== ".mosaic-cache")
    .sort((a, b) => a.localeCompare(b, "en"))

  console.log(`Found ${files.length} images. Processing...`)

  const results = []
  for (const filename of files) {
    if (existingMap.has(filename)) {
      results.push(existingMap.get(filename))
      process.stdout.write(".")
      continue
    }
    try {
      const meta = await processPhoto(filename)
      results.push(meta)
      process.stdout.write("+")
    } catch (err) {
      console.error(`\nSkipping ${filename}: ${err.message}`)
    }
  }

  writeFileSync(PHOTOS_JSON, JSON.stringify(results, null, 2), "utf8")
  console.log(`\nWritten ${results.length} photos to ${PHOTOS_JSON}`)
}

main().catch(err => { console.error(err); process.exit(1) })
