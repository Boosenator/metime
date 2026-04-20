import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import sharp from "sharp"

const mosaicSeedFiles = [
  "dance-1.jpg",
  "wedding-1.jpg",
  "wedding-2.jpg",
  "lovestory-1.jpg",
  "kids-1.jpg",
  "kids-2.jpg",
  "custom-10.jpg",
  "custom-32.jpg",
  "custom-50.jpg",
  "custom-80.jpg",
] as const

const supportedPhotoCategories = new Set([
  "dance",
  "wedding",
  "kids",
  "brand",
  "custom",
  "lovestory",
  "portrait",
  "commercial",
])

type Rgb = { r: number; g: number; b: number }
type Lab = { l: number; a: number; b: number }

type EdgeSignature = {
  mean: Rgb
  segments: Rgb[]
  brightness: number
  contrast: number
}

type PhotoAnalysis = {
  src: string
  brightness: number
  top: EdgeSignature
  right: EdgeSignature
  bottom: EdgeSignature
  left: EdgeSignature
}

type Slot = {
  index: number
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

type NeighborLink = {
  a: number
  b: number
  direction: "horizontal" | "vertical"
  weight: number
}

export type PortfolioPhoto = {
  id: number
  src: string
  category: string
  alt: string
  wide: boolean
  fullSrc?: string
  spanCols: number
  spanRows: number
}

const CONTACT_SHEET_ROWS = 8
const THUMB_CACHE_DIR = join(process.cwd(), "public", "images", "portfolio", ".mosaic-cache")
const THUMB_SIZE = 220

const DESKTOP_SLOTS: Slot[] = [
  { index: 0, col: 1, row: 1, colSpan: 5, rowSpan: 2 },
  { index: 1, col: 6, row: 1, colSpan: 4, rowSpan: 1 },
  { index: 2, col: 10, row: 1, colSpan: 3, rowSpan: 2 },
  { index: 3, col: 6, row: 2, colSpan: 4, rowSpan: 1 },
  { index: 4, col: 1, row: 3, colSpan: 3, rowSpan: 1 },
  { index: 5, col: 4, row: 3, colSpan: 5, rowSpan: 1 },
  { index: 6, col: 9, row: 3, colSpan: 3, rowSpan: 1 },
  { index: 7, col: 1, row: 4, colSpan: 3, rowSpan: 1 },
  { index: 8, col: 4, row: 4, colSpan: 4, rowSpan: 1 },
  { index: 9, col: 8, row: 4, colSpan: 2, rowSpan: 1 },
]

const DESKTOP_NEIGHBORS = buildNeighborLinks(DESKTOP_SLOTS)

let cachedPortfolioPromise: Promise<{
  mosaicPhotos: PortfolioPhoto[]
  galleryPhotos: PortfolioPhoto[]
}> | null = null

export async function getPortfolioPhotos(): Promise<{
  mosaicPhotos: PortfolioPhoto[]
  galleryPhotos: PortfolioPhoto[]
}> {
  if (!cachedPortfolioPromise) {
    cachedPortfolioPromise = buildPortfolioPhotos().catch((error) => {
      console.warn("mosaic-analysis: using fallback portfolio data", error)
      const galleryPhotos = buildGalleryPhotos(listPortfolioImageFiles())
      return {
        mosaicPhotos: galleryPhotos.map((photo) => ({
          ...photo,
          fullSrc: photo.src,
          src: photo.src,
        })),
        galleryPhotos,
      }
    })
  }

  return cachedPortfolioPromise
}

async function buildPortfolioPhotos(): Promise<{
  mosaicPhotos: PortfolioPhoto[]
  galleryPhotos: PortfolioPhoto[]
}> {
  const allFiles = listPortfolioImageFiles()
  const galleryPhotos = buildGalleryPhotos(allFiles)
  const analyses = await Promise.all(
    allFiles.map((fileName) => analyzePhoto(`/images/portfolio/${fileName}`))
  )
  const mosaicPhotos = await buildMosaicPhotos(analyses, galleryPhotos)

  return {
    mosaicPhotos,
    galleryPhotos,
  }
}

async function buildMosaicPhotos(
  analyses: PhotoAnalysis[],
  galleryPhotos: PortfolioPhoto[]
): Promise<PortfolioPhoto[]> {
  const slots = buildContactSheetSlots(analyses.length, CONTACT_SHEET_ROWS)
  const neighbors = buildNeighborLinks(slots)
  const assignment = createGreedyAssignment(analyses, slots, neighbors)
  improveAssignment(assignment, analyses, neighbors, 5)

  const orderedPhotos = await Promise.all(
    assignment
    .filter((photoIndex) => photoIndex !== -1)
    .map(async (photoIndex) => {
      const fullSrc = analyses[photoIndex].src
      const matchedPhoto = galleryPhotos.find((photo) => photo.src === fullSrc)

      return {
        id: matchedPhoto?.id ?? photoIndex + 1,
        src: await ensureMosaicThumb(fullSrc),
        fullSrc,
        category: matchedPhoto?.category ?? "custom",
        alt: matchedPhoto?.alt ?? `Портфоліо фото ${photoIndex + 1}`,
        wide: false,
        spanCols: matchedPhoto?.spanCols ?? 1,
        spanRows: matchedPhoto?.spanRows ?? 1,
      }
    })
  )

  return orderedPhotos
}

async function ensureMosaicThumb(fullSrc: string): Promise<string> {
  mkdirSync(THUMB_CACHE_DIR, { recursive: true })

  const fileName = fullSrc.split("/").pop() ?? "image.jpg"
  const thumbFileName = fileName.replace(/\.[^.]+$/, ".webp")
  const sourcePath = join(process.cwd(), "public", fullSrc.replace(/^\//, ""))
  const thumbPath = join(THUMB_CACHE_DIR, thumbFileName)

  const sourceStat = statSync(sourcePath)
  const shouldRegenerate =
    !existsSync(thumbPath) || statSync(thumbPath).mtimeMs < sourceStat.mtimeMs

  if (shouldRegenerate) {
    const buffer = readFileSync(sourcePath)
    await sharp(buffer)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 62 })
      .toFile(thumbPath)
  }

  return `/images/portfolio/.mosaic-cache/${thumbFileName}`
}

function buildContactSheetSlots(count: number, rows: number): Slot[] {
  const columns = Math.max(1, Math.ceil(count / rows))
  const slots: Slot[] = []

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns) + 1
    const col = (index % columns) + 1
    slots.push({
      index,
      col,
      row,
      colSpan: 1,
      rowSpan: 1,
    })
  }

  return slots
}

function listPortfolioImageFiles(): string[] {
  return readdirSync(join(process.cwd(), "public", "images", "portfolio"))
    .filter((fileName) => /\.(jpg|jpeg|png|webp)$/i.test(fileName))
    .filter((fileName) => !/^video-/i.test(fileName))
    .sort((left, right) => left.localeCompare(right, "en"))
}

function buildGalleryPhotos(fileNames: string[]): PortfolioPhoto[] {
  return fileNames.map((fileName, index) => {
    const category = getPhotoCategory(fileName)
    const { spanCols, spanRows } = getPhotoSpan(fileName)
    return {
      id: index + 1,
      src: `/images/portfolio/${fileName}`,
      category,
      alt: buildPhotoAlt(category, index + 1),
      wide: index % 5 === 0 || index % 7 === 0,
      spanCols,
      spanRows,
    }
  })
}

function getPhotoSpan(fileName: string): { spanCols: number; spanRows: number } {
  const lower = fileName.toLowerCase()
  if (lower.includes("-tall") || lower.includes("_tall")) return { spanCols: 2, spanRows: 4 }
  if (lower.includes("-wide") || lower.includes("_wide")) return { spanCols: 4, spanRows: 2 }
  return { spanCols: 1, spanRows: 1 }
}

function getPhotoCategory(fileName: string): string {
  const prefix = fileName.toLowerCase().split("-")[0]
  return supportedPhotoCategories.has(prefix) ? prefix : "custom"
}

function buildPhotoAlt(category: string, index: number): string {
  const labels: Record<string, string> = {
    dance: "Танцювальна зйомка",
    wedding: "Весільна зйомка",
    kids: "Дитяча зйомка",
    brand: "Брендова зйомка",
    custom: "Портфоліо фото",
  }

  return `${labels[category] ?? labels.custom} ${index}`
}

async function analyzePhoto(src: string): Promise<PhotoAnalysis> {
  const absolutePath = join(process.cwd(), "public", src.replace(/^\//, ""))
  const buffer = readFileSync(absolutePath)
  const image = sharp(buffer).rotate()
  const { data, info } = await image
    .resize(96, 96, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height
  const strip = Math.max(6, Math.round(width * 0.12))

  return {
    src,
    brightness: computeBrightness(data),
    top: buildEdgeSignature(data, width, height, {
      x: 0,
      y: 0,
      width,
      height: strip,
      axis: "x",
    }),
    right: buildEdgeSignature(data, width, height, {
      x: width - strip,
      y: 0,
      width: strip,
      height,
      axis: "y",
    }),
    bottom: buildEdgeSignature(data, width, height, {
      x: 0,
      y: height - strip,
      width,
      height: strip,
      axis: "x",
    }),
    left: buildEdgeSignature(data, width, height, {
      x: 0,
      y: 0,
      width: strip,
      height,
      axis: "y",
    }),
  }
}

function buildEdgeSignature(
  data: Uint8Array | Buffer,
  imageWidth: number,
  imageHeight: number,
  region: {
    x: number
    y: number
    width: number
    height: number
    axis: "x" | "y"
  }
): EdgeSignature {
  const mean = averageRegion(data, imageWidth, region.x, region.y, region.width, region.height)
  const segments = buildSegments(data, imageWidth, imageHeight, region)
  const brightness = colorBrightness(mean)
  const contrast = computeRegionContrast(
    data,
    imageWidth,
    region.x,
    region.y,
    region.width,
    region.height
  )

  return { mean, segments, brightness, contrast }
}

function buildSegments(
  data: Uint8Array | Buffer,
  imageWidth: number,
  imageHeight: number,
  region: {
    x: number
    y: number
    width: number
    height: number
    axis: "x" | "y"
  }
): Rgb[] {
  const segmentCount = 6
  const segments: Rgb[] = []

  for (let index = 0; index < segmentCount; index += 1) {
    if (region.axis === "x") {
      const startX = region.x + Math.floor((region.width * index) / segmentCount)
      const endX = region.x + Math.floor((region.width * (index + 1)) / segmentCount)
      segments.push(
        averageRegion(
          data,
          imageWidth,
          startX,
          region.y,
          Math.max(1, endX - startX),
          region.height
        )
      )
      continue
    }

    const startY = region.y + Math.floor((region.height * index) / segmentCount)
    const endY = region.y + Math.floor((region.height * (index + 1)) / segmentCount)
    segments.push(
      averageRegion(
        data,
        imageWidth,
        region.x,
        startY,
        region.width,
        Math.max(1, endY - startY)
      )
    )
  }

  if (region.axis === "y" && imageHeight < segmentCount) {
    return segments.slice(0, imageHeight)
  }

  return segments
}

function averageRegion(
  data: Uint8Array | Buffer,
  imageWidth: number,
  startX: number,
  startY: number,
  regionWidth: number,
  regionHeight: number
): Rgb {
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let y = startY; y < startY + regionHeight; y += 1) {
    for (let x = startX; x < startX + regionWidth; x += 1) {
      const offset = (y * imageWidth + x) * 3
      r += data[offset]
      g += data[offset + 1]
      b += data[offset + 2]
      count += 1
    }
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
  }
}

function computeRegionContrast(
  data: Uint8Array | Buffer,
  imageWidth: number,
  startX: number,
  startY: number,
  regionWidth: number,
  regionHeight: number
): number {
  const brightnessValues: number[] = []

  for (let y = startY; y < startY + regionHeight; y += 1) {
    for (let x = startX; x < startX + regionWidth; x += 1) {
      const offset = (y * imageWidth + x) * 3
      brightnessValues.push(
        colorBrightness({
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        })
      )
    }
  }

  const mean =
    brightnessValues.reduce((sum, value) => sum + value, 0) / brightnessValues.length

  const variance =
    brightnessValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    brightnessValues.length

  return Math.sqrt(variance)
}

function computeBrightness(data: Uint8Array | Buffer): number {
  let total = 0
  const pixels = data.length / 3

  for (let index = 0; index < data.length; index += 3) {
    total += colorBrightness({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
    })
  }

  return total / pixels
}

function colorBrightness(color: Rgb): number {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
}

function buildNeighborLinks(slots: Slot[]): NeighborLink[] {
  const links: NeighborLink[] = []

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const left = slots[i]
      const right = slots[j]

      if (touchesHorizontally(left, right)) {
        links.push({
          a: left.col < right.col ? left.index : right.index,
          b: left.col < right.col ? right.index : left.index,
          direction: "horizontal",
          weight: sharedVerticalSpan(left, right),
        })
      }

      if (touchesVertically(left, right)) {
        links.push({
          a: left.row < right.row ? left.index : right.index,
          b: left.row < right.row ? right.index : left.index,
          direction: "vertical",
          weight: sharedHorizontalSpan(left, right),
        })
      }
    }
  }

  return links
}

function touchesHorizontally(a: Slot, b: Slot): boolean {
  return a.col + a.colSpan === b.col || b.col + b.colSpan === a.col
}

function touchesVertically(a: Slot, b: Slot): boolean {
  return a.row + a.rowSpan === b.row || b.row + b.rowSpan === a.row
}

function sharedVerticalSpan(a: Slot, b: Slot): number {
  const start = Math.max(a.row, b.row)
  const end = Math.min(a.row + a.rowSpan, b.row + b.rowSpan)
  return Math.max(0, end - start)
}

function sharedHorizontalSpan(a: Slot, b: Slot): number {
  const start = Math.max(a.col, b.col)
  const end = Math.min(a.col + a.colSpan, b.col + b.colSpan)
  return Math.max(0, end - start)
}

function createGreedyAssignment(
  analyses: PhotoAnalysis[],
  slots: Slot[],
  links: NeighborLink[]
): number[] {
  const scoreBySlot = new Map<number, number>()
  for (const slot of slots) scoreBySlot.set(slot.index, 0)

  for (const link of links) {
    scoreBySlot.set(link.a, (scoreBySlot.get(link.a) ?? 0) + link.weight)
    scoreBySlot.set(link.b, (scoreBySlot.get(link.b) ?? 0) + link.weight)
  }

  const orderedSlots = [...slots].sort(
    (left, right) => (scoreBySlot.get(right.index) ?? 0) - (scoreBySlot.get(left.index) ?? 0)
  )

  const assignment = new Array<number>(slots.length).fill(-1)
  const remaining = new Set(analyses.map((_, index) => index))

  for (const slot of orderedSlots) {
    let bestPhoto = -1
    let bestScore = Number.NEGATIVE_INFINITY

    for (const candidate of remaining) {
      const candidateScore = scorePlacement(slot.index, candidate, assignment, analyses, links)
      if (candidateScore > bestScore) {
        bestScore = candidateScore
        bestPhoto = candidate
      }
    }

    assignment[slot.index] = bestPhoto
    remaining.delete(bestPhoto)
  }

  return assignment
}

function improveAssignment(
  assignment: number[],
  analyses: PhotoAnalysis[],
  links: NeighborLink[],
  maxIterations = 30
): void {
  let improved = true
  let iterations = 0

  while (improved && iterations < maxIterations) {
    improved = false
    iterations += 1

    for (let left = 0; left < assignment.length; left += 1) {
      for (let right = left + 1; right < assignment.length; right += 1) {
        const currentScore = totalAssignmentScore(assignment, analyses, links)
        ;[assignment[left], assignment[right]] = [assignment[right], assignment[left]]
        const swappedScore = totalAssignmentScore(assignment, analyses, links)

        if (swappedScore > currentScore) {
          improved = true
          continue
        }

        ;[assignment[left], assignment[right]] = [assignment[right], assignment[left]]
      }
    }
  }
}

function scorePlacement(
  slotIndex: number,
  photoIndex: number,
  assignment: number[],
  analyses: PhotoAnalysis[],
  links: NeighborLink[]
): number {
  let total = basePhotoScore(analyses[photoIndex])
  let matchedNeighbors = 0

  for (const link of links) {
    if (link.a !== slotIndex && link.b !== slotIndex) continue

    const neighborSlot = link.a === slotIndex ? link.b : link.a
    const neighborPhoto = assignment[neighborSlot]
    if (neighborPhoto === -1) continue

    matchedNeighbors += 1
    total += pairScore(
      slotIndex < neighborSlot ? analyses[photoIndex] : analyses[neighborPhoto],
      slotIndex < neighborSlot ? analyses[neighborPhoto] : analyses[photoIndex],
      link.direction,
      link.weight
    )
  }

  if (matchedNeighbors === 0) {
    total += basePhotoScore(analyses[photoIndex]) * 0.5
  }

  return total
}

function totalAssignmentScore(
  assignment: number[],
  analyses: PhotoAnalysis[],
  links: NeighborLink[]
): number {
  let total = assignment.reduce(
    (sum, photoIndex) => sum + basePhotoScore(analyses[photoIndex]),
    0
  )

  for (const link of links) {
    total += pairScore(
      analyses[assignment[link.a]],
      analyses[assignment[link.b]],
      link.direction,
      link.weight
    )
  }

  return total
}

function pairScore(
  first: PhotoAnalysis,
  second: PhotoAnalysis,
  direction: "horizontal" | "vertical",
  weight: number
): number {
  const edgeA = direction === "horizontal" ? first.right : first.bottom
  const edgeB = direction === "horizontal" ? second.left : second.top

  const colorDistance = colorDifference(edgeA.mean, edgeB.mean)
  const brightnessDistance = Math.abs(edgeA.brightness - edgeB.brightness)
  const contrastDistance = Math.abs(edgeA.contrast - edgeB.contrast)
  const segmentDistance = averageSegmentDistance(edgeA.segments, edgeB.segments)
  const overallBrightnessDistance = Math.abs(first.brightness - second.brightness)

  const score =
    320 -
    colorDistance * 1.1 -
    segmentDistance * 1.45 -
    brightnessDistance * 0.8 -
    contrastDistance * 0.55 -
    overallBrightnessDistance * 0.3

  return score * weight
}

function averageSegmentDistance(left: Rgb[], right: Rgb[]): number {
  const count = Math.min(left.length, right.length)
  let total = 0

  for (let index = 0; index < count; index += 1) {
    total += colorDifference(left[index], right[index])
  }

  return total / count
}

function colorDifference(left: Rgb, right: Rgb): number {
  const leftLab = rgbToLab(left)
  const rightLab = rgbToLab(right)
  return deltaE(leftLab, rightLab)
}

function rgbToLab(color: Rgb): Lab {
  const [x, y, z] = rgbToXyz(color)
  const refX = 95.047
  const refY = 100
  const refZ = 108.883

  const fx = labPivot(x / refX)
  const fy = labPivot(y / refY)
  const fz = labPivot(z / refZ)

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

function rgbToXyz(color: Rgb): [number, number, number] {
  const r = xyzPivot(color.r / 255)
  const g = xyzPivot(color.g / 255)
  const b = xyzPivot(color.b / 255)

  return [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
    (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
    (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100,
  ]
}

function xyzPivot(value: number): number {
  return value > 0.04045
    ? ((value + 0.055) / 1.055) ** 2.4
    : value / 12.92
}

function labPivot(value: number): number {
  return value > 0.008856
    ? value ** (1 / 3)
    : 7.787 * value + 16 / 116
}

function deltaE(left: Lab, right: Lab): number {
  return Math.sqrt(
    (left.l - right.l) ** 2 +
      (left.a - right.a) ** 2 +
      (left.b - right.b) ** 2
  )
}

function basePhotoScore(photo: PhotoAnalysis): number {
  const preferredBrightness = 138
  const brightnessPenalty = Math.abs(photo.brightness - preferredBrightness) * 0.35
  return 80 - brightnessPenalty
}
