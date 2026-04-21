import { readdir, readFile, writeFile } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import { join, extname, dirname, resolve, relative } from "path"

const OUT_DIR = "out"
const ROOT_PREFIXES = [
  "/_next/",
  "/images/",
  "/media/",
  "/icon",
  "/favicon",
  "/apple-icon",
]

const fontCache = new Map()

function getRelativeRootPrefix(filePath) {
  const fileDir = dirname(resolve(filePath))
  const outDir = resolve(OUT_DIR)
  const rel = relative(fileDir, outDir)

  if (!rel) return "./"

  const normalized = rel.replace(/\\/g, "/")
  return normalized.endsWith("/") ? normalized : normalized + "/"
}

function fixRootRelativePaths(content, filePath) {
  let result = content
  const rootPrefix = getRelativeRootPrefix(filePath)

  for (const prefix of ROOT_PREFIXES) {
    const target = rootPrefix + prefix.slice(1)
    const local = "./" + prefix.slice(1)

    result = result.replaceAll(`src="${prefix}`, `src="${target}`)
    result = result.replaceAll(`href="${prefix}`, `href="${target}`)
    result = result.replaceAll(`content="${prefix}`, `content="${target}`)

    result = result.replaceAll(`src="${local}`, `src="${target}`)
    result = result.replaceAll(`href="${local}`, `href="${target}`)
    result = result.replaceAll(`content="${local}`, `content="${target}`)

    result = result.replaceAll(`url(${prefix}`, `url(${target}`)
    result = result.replaceAll(`url("${prefix}`, `url("${target}`)
    result = result.replaceAll(`url('${prefix}`, `url('${target}`)

    result = result.replaceAll(`url(${local}`, `url(${target}`)
    result = result.replaceAll(`url("${local}`, `url("${target}`)
    result = result.replaceAll(`url('${local}`, `url('${target}`)

    result = result.replaceAll(`"${prefix}`, `"${target}`)
    result = result.replaceAll(`'${prefix}`, `'${target}`)
    result = result.replaceAll(`"${local}`, `"${target}`)
    result = result.replaceAll(`'${local}`, `'${target}`)

    result = result.replaceAll(`\\"${prefix}`, `\\"${target}`)
    result = result.replaceAll(`\\"${local}`, `\\"${target}`)
  }

  return result
}

function getFontBase64(absPath) {
  if (fontCache.has(absPath)) return fontCache.get(absPath)
  if (!existsSync(absPath)) return null

  const data = "data:font/woff2;base64," + readFileSync(absPath).toString("base64")
  fontCache.set(absPath, data)
  return data
}

async function replaceAsync(str, regex, fn) {
  const jobs = []
  str.replace(regex, (match, ...args) => {
    jobs.push(fn(match, ...args))
    return match
  })
  const results = await Promise.all(jobs)
  return str.replace(regex, () => results.shift())
}

async function inlineFonts(content, filePath) {
  const fileDir = dirname(resolve(filePath))

  return replaceAsync(content, /url\(["']?([^"')]*\.woff2)["']?\)/g, async (match, rel) => {
    const abs = resolve(fileDir, rel)
    const b64 = getFontBase64(abs)
    return b64 ? `url("${b64}")` : match
  })
}

function removeFontPreloads(html) {
  let result = html.replace(/<link[^>]*href="[^"]*\.woff2"[^>]*\/?>/g, "")
  result = result.replace(/:HL\[\\"[^"]*\.woff2[^\]]*\]\\n/g, "")
  return result
}

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)))
    } else {
      files.push(full)
    }
  }

  return files
}

async function main() {
  console.log("postbuild: starting...")

  const allFiles = await walkDir(OUT_DIR)
  let changed = 0

  await Promise.all(
    allFiles.map(async (filePath) => {
      const ext = extname(filePath).toLowerCase()
      if (![".html", ".js", ".css", ".json"].includes(ext)) return

      const original = await readFile(filePath, "utf8")
      let content = fixRootRelativePaths(original, filePath)

      if (ext === ".html" || ext === ".css") {
        content = await inlineFonts(content, filePath)
      }

      if (ext === ".html") {
        content = removeFontPreloads(content)
      }

      if (content !== original) {
        await writeFile(filePath, content, "utf8")
        changed += 1
      }
    })
  )

  console.log(`postbuild: patched ${changed} files - done.`)
}

main().catch((error) => {
  console.error("postbuild failed:", error)
  process.exit(1)
})
