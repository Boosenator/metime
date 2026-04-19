import { readdir, stat } from "fs/promises"
import { join, extname } from "path"
import sharp from "sharp"

const DIR = "public/images/portfolio"
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 82

async function main() {
  const files = (await readdir(DIR)).filter(f =>
    /\.(jpg|jpeg)$/i.test(f) && !f.startsWith("video-")
  )

  console.log(`Compressing ${files.length} images…`)

  let savedTotal = 0
  let done = 0

  await Promise.all(
    files.map(async (file) => {
      const path = join(DIR, file)
      const before = (await stat(path)).size

      const buf = await sharp(path)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer()

      if (buf.length < before) {
        await sharp(buf).toFile(path)
        savedTotal += before - buf.length
      }

      done++
      if (done % 20 === 0) console.log(`  ${done}/${files.length}`)
    })
  )

  console.log(`Done. Saved ${(savedTotal / 1024 / 1024).toFixed(1)} MB`)
}

main().catch(err => { console.error(err); process.exit(1) })
