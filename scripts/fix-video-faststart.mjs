/**
 * fix-video-faststart.mjs
 *
 * Downloads every portfolio video from Vercel Blob, moves the moov atom
 * to the front (faststart), then re-uploads to the same Blob path so the
 * src URL stays identical — no DB updates needed.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_... node scripts/fix-video-faststart.mjs
 *
 *   Or put BLOB_READ_WRITE_TOKEN in .env.local and run:
 *   node --env-file=.env.local scripts/fix-video-faststart.mjs
 *
 * Requirements: ffmpeg must be installed and available in PATH.
 */

import { execSync, spawnSync } from "child_process"
import { createWriteStream, mkdirSync, rmSync, existsSync } from "fs"
import { readFile } from "fs/promises"
import { join, extname } from "path"
import { pipeline } from "stream/promises"
import { list as blobList, put as blobPut } from "@vercel/blob"
import https from "https"
import http from "http"

// ── Config ────────────────────────────────────────────────────────────────────

const BLOB_VIDEOS_JSON   = "portfolio/videos.json"
const BLOB_VIDEO_PREFIX  = "portfolio/videos"
const TMP_DIR            = join(process.cwd(), ".tmp-faststart")

// ── Helpers ───────────────────────────────────────────────────────────────────

function checkFfmpeg() {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" })
  if (result.error || result.status !== 0) {
    console.error("❌  ffmpeg не знайдено. Встанови його:")
    console.error("    Windows: winget install Gyan.FFmpeg")
    console.error("    Mac:     brew install ffmpeg")
    process.exit(1)
  }
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http
    client.get(url, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on("error", reject)
  })
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const out = createWriteStream(destPath)
      pipeline(res, out).then(resolve).catch(reject)
    }).on("error", reject)
  })
}

function applyFaststart(inputPath, outputPath) {
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", inputPath, "-c", "copy", "-movflags", "+faststart", outputPath],
    { stdio: ["ignore", "ignore", "pipe"] }
  )
  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? ""
    throw new Error(`ffmpeg failed:\n${stderr.slice(-500)}`)
  }
}

async function reupload(localPath, blobPathname, mimeType) {
  const { readFile } = await import("fs/promises")
  const data = await readFile(localPath)
  await blobPut(blobPathname, data, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: mimeType ?? "video/mp4",
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌  Потрібна змінна BLOB_READ_WRITE_TOKEN")
    console.error("    node --env-file=.env.local scripts/fix-video-faststart.mjs")
    process.exit(1)
  }

  checkFfmpeg()
  mkdirSync(TMP_DIR, { recursive: true })

  // 1. Отримати список відео з Blob
  console.log("📥  Читаю videos.json з Blob...")
  let videos
  try {
    const { blobs } = await blobList({ prefix: BLOB_VIDEOS_JSON })
    const meta = blobs.find((b) => b.pathname === BLOB_VIDEOS_JSON)
    if (!meta) throw new Error("videos.json не знайдено в Blob")
    videos = await fetchJson(meta.url)
  } catch (e) {
    console.error("❌  Не вдалося отримати videos.json з Blob:", e.message)
    process.exit(1)
  }

  const withSrc = videos.filter((v) => v.src && v.src.startsWith("http"))
  console.log(`🎬  Знайдено ${withSrc.length} відео для обробки\n`)

  if (withSrc.length === 0) {
    console.log("✅  Нічого обробляти")
    return
  }

  // 2. Обробити кожне відео
  let ok = 0
  let fail = 0

  for (const video of withSrc) {
    const ext = extname(video.filename) || ".mp4"
    const inputPath  = join(TMP_DIR, `input_${video.id}${ext}`)
    const outputPath = join(TMP_DIR, `output_${video.id}${ext}`)
    const blobPath   = `${BLOB_VIDEO_PREFIX}/${video.filename}`

    process.stdout.write(`  ⏳  ${video.filename} — завантаження...`)

    try {
      await downloadFile(video.src, inputPath)
      process.stdout.write(" faststart...")
      applyFaststart(inputPath, outputPath)
      process.stdout.write(" upload...")
      await reupload(outputPath, blobPath, video.mimeType)
      console.log(" ✅")
      ok++
    } catch (e) {
      console.log(` ❌  ${e.message}`)
      fail++
    } finally {
      if (existsSync(inputPath))  rmSync(inputPath)
      if (existsSync(outputPath)) rmSync(outputPath)
    }
  }

  // 3. Прибрати tmp
  rmSync(TMP_DIR, { recursive: true, force: true })

  console.log(`\n✅  Готово: ${ok} оброблено, ${fail} помилок`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
