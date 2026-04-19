/**
 * Postbuild: makes the out/ directory work when opened via file:// protocol.
 *
 * 1. Fixes absolute public-folder paths  (/images/ → ./images/ etc.)
 * 2. Inlines woff2 fonts as base64 data URIs  (eliminates CORS font errors)
 * 3. Removes font preload <link> tags (no longer needed after inlining)
 */

import { readdir, readFile, writeFile } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import { join, extname, dirname, resolve } from "path"

const OUT_DIR = "out"

// ─── 1. Public-folder path fixing ────────────────────────────────────────────

const PUBLIC_PREFIXES = ["/images/", "/media/", "/icon", "/favicon", "/apple-icon"]

function fixPublicPaths(content) {
  let s = content
  for (const p of PUBLIC_PREFIXES) {
    const d = "." + p
    // HTML attributes
    s = s.replaceAll('src="' + p, 'src="' + d)
    s = s.replaceAll('href="' + p, 'href="' + d)
    s = s.replaceAll('content="' + p, 'content="' + d)
    // CSS url()
    s = s.replaceAll("url(" + p, "url(" + d)
    s = s.replaceAll('url("' + p, 'url("' + d)
    s = s.replaceAll("url('" + p, "url('" + d)
    // JS string literals (unescaped double/single quotes)
    s = s.replaceAll('"' + p, '"' + d)
    s = s.replaceAll("'" + p, "'" + d)
    // JSON strings embedded inside JS (escaped quotes) — RSC payload, __next_f.push, etc.
    // These look like:  \"\/images\/  in the raw HTML source
    s = s.replaceAll('\\"' + p, '\\"' + d)
  }
  return s
}

// ─── 2. Font inlining ─────────────────────────────────────────────────────────

const fontCache = new Map()

function getFontBase64(absPath) {
  if (fontCache.has(absPath)) return fontCache.get(absPath)
  if (!existsSync(absPath)) return null
  const b64 = "data:font/woff2;base64," + readFileSync(absPath).toString("base64")
  fontCache.set(absPath, b64)
  return b64
}

async function replaceAsync(str, regex, fn) {
  const jobs = []
  str.replace(regex, (m, ...args) => { jobs.push(fn(m, ...args)); return m })
  const results = await Promise.all(jobs)
  return str.replace(regex, () => results.shift())
}

async function inlineFonts(content, filePath) {
  const fileDir = dirname(resolve(filePath))
  return replaceAsync(content, /url\(["']?([^"')]*\.woff2)["']?\)/g, async (match, rel) => {
    const abs = resolve(fileDir, rel)
    const b64 = getFontBase64(abs)
    return b64 ? 'url("' + b64 + '")' : match
  })
}

function removeFontPreloads(html) {
  // 1. Remove static <link rel="preload" ...woff2...> tags
  let result = html.replace(/<link[^>]*href="[^"]*\.woff2"[^>]*\/?>/g, "")
  // 2. Remove :HL[...woff2...] entries from Next.js RSC flight data in <script> tags
  //    These dynamically inject crossorigin preload links at runtime
  result = result.replace(/:HL\[\\"[^"]*\.woff2[^\]]*\]\\n/g, "")
  return result
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walkDir(full)))
    else files.push(full)
  }
  return files
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("postbuild: starting...")

  const allFiles = await walkDir(OUT_DIR)
  let changed = 0

  await Promise.all(
    allFiles.map(async (filePath) => {
      const ext = extname(filePath).toLowerCase()
      if (![".html", ".js", ".css", ".json"].includes(ext)) return

      const original = await readFile(filePath, "utf8")
      let content = original

      // 1. fix public paths
      content = fixPublicPaths(content)

      // 2. inline fonts in HTML and CSS files
      if (ext === ".html" || ext === ".css") {
        content = await inlineFonts(content, filePath)
      }

      // 3. remove font preload links from HTML
      if (ext === ".html") {
        content = removeFontPreloads(content)
      }

      if (content !== original) {
        await writeFile(filePath, content, "utf8")
        changed++
      }
    })
  )

  console.log("postbuild: patched " + changed + " files — done.")
}

main().catch((err) => {
  console.error("postbuild failed:", err)
  process.exit(1)
})
