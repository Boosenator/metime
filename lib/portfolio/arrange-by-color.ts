import type { PhotoMeta, GridConfig, Cell, LabColor } from "./types"
import { labDistance } from "./color-utils"

export const ARRANGE_STRATEGIES = ["neighbors", "lightness", "radial"] as const

export type ArrangeStrategy = (typeof ARRANGE_STRATEGIES)[number]

export function arrangeByColor(
  photos: PhotoMeta[],
  grid: GridConfig,
  strategy: ArrangeStrategy = "neighbors"
): Cell[] {
  const activePhotos = photos.filter((photo) => !photo.excluded)
  if (activePhotos.length === 0) return []

  if (strategy === "lightness") {
    return arrangeByLightnessBands(activePhotos, grid)
  }

  if (strategy === "radial") {
    return arrangeByRadialNeighbors(activePhotos, grid)
  }

  return arrangeByNeighborSimilarity(activePhotos, grid)
}

function arrangeByNeighborSimilarity(photos: PhotoMeta[], grid: GridConfig): Cell[] {
  const totalCells = grid.cols * grid.rows
  const pool = [...photos]
  const cells: (Cell | null)[] = new Array(totalCells).fill(null)
  const placed = new Set<string>()

  const idx = (x: number, y: number) => y * grid.cols + x

  const getNeighborLabs = (x: number, y: number): LabColor[] => {
    const neighbors: LabColor[] = []
    const offsets = [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ]
    for (const [dx, dy] of offsets) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= grid.cols || ny < 0 || ny >= grid.rows) continue
      const cell = cells[idx(nx, ny)]
      if (cell) {
        const photo = photos.find((p) => p.id === cell.photoId)
        if (photo) neighbors.push(photo.lab)
      }
    }
    return neighbors
  }

  const neighborScore = (lab: LabColor, x: number, y: number): number => {
    const neighbors = getNeighborLabs(x, y)
    if (neighbors.length === 0) return 0
    return neighbors.reduce((sum, n) => sum + labDistance(lab, n), 0) / neighbors.length
  }

  // Select 4 corner seeds: photos with maximum pairwise Lab distance
  const corners = selectCornerPhotos(photos, 4)
  const cornerPositions = [
    { x: 0, y: 0 },
    { x: grid.cols - 1, y: 0 },
    { x: 0, y: grid.rows - 1 },
    { x: grid.cols - 1, y: grid.rows - 1 },
  ]

  for (let i = 0; i < corners.length && i < cornerPositions.length; i++) {
    const pos = cornerPositions[i]
    const photo = corners[i]
    cells[idx(pos.x, pos.y)] = { photoId: photo.id, x: pos.x, y: pos.y, spanX: 1, spanY: 1 }
    placed.add(photo.id)
  }

  // Fill remaining cells row by row, picking best-fit photo by neighbor Lab distance
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (cells[idx(x, y)] !== null) continue

      const available = pool.filter((p) => !placed.has(p.id))
      if (available.length === 0) break

      const best = available.reduce((bestPhoto, candidate) => {
        const scoreA = neighborScore(bestPhoto.lab, x, y)
        const scoreB = neighborScore(candidate.lab, x, y)
        return scoreB < scoreA ? candidate : bestPhoto
      })

      cells[idx(x, y)] = { photoId: best.id, x, y, spanX: 1, spanY: 1 }
      placed.add(best.id)
    }
  }

  return cells.filter((c): c is Cell => c !== null)
}

function arrangeByLightnessBands(photos: PhotoMeta[], grid: GridConfig): Cell[] {
  const totalCells = Math.min(photos.length, grid.cols * grid.rows)
  const sorted = [...photos].sort((a, b) => {
    if (a.lab.L !== b.lab.L) return a.lab.L - b.lab.L
    if (a.lab.a !== b.lab.a) return a.lab.a - b.lab.a
    if (a.lab.b !== b.lab.b) return a.lab.b - b.lab.b
    return a.id.localeCompare(b.id)
  })

  const cells: Cell[] = []
  let photoIndex = 0

  for (let y = 0; y < grid.rows && photoIndex < totalCells; y++) {
    const xPositions = Array.from({ length: grid.cols }, (_, i) => i)
    if (y % 2 === 1) xPositions.reverse()

    for (const x of xPositions) {
      const photo = sorted[photoIndex++]
      if (!photo) break
      cells.push({ photoId: photo.id, x, y, spanX: 1, spanY: 1 })
    }
  }

  return cells
}

function arrangeByRadialNeighbors(photos: PhotoMeta[], grid: GridConfig): Cell[] {
  const totalCells = Math.min(photos.length, grid.cols * grid.rows)
  const positions = getRadialPositions(grid).slice(0, totalCells)
  if (positions.length === 0) return []

  const available = [...photos]
  const cells: Cell[] = []
  const photoById = new Map(photos.map((photo) => [photo.id, photo]))

  const center = {
    L: average(photos.map((photo) => photo.lab.L)),
    a: average(photos.map((photo) => photo.lab.a)),
    b: average(photos.map((photo) => photo.lab.b)),
  }

  const firstPhoto = [...available].sort((left, right) => {
    const leftScore = labDistance(left.lab, center)
    const rightScore = labDistance(right.lab, center)
    return leftScore - rightScore || left.id.localeCompare(right.id)
  })[0]

  if (!firstPhoto) return []
  cells.push({ photoId: firstPhoto.id, x: positions[0].x, y: positions[0].y, spanX: 1, spanY: 1 })
  available.splice(available.findIndex((photo) => photo.id === firstPhoto.id), 1)

  for (let i = 1; i < positions.length; i++) {
    const pos = positions[i]
    const neighbors = cells
      .filter((cell) => Math.abs(cell.x - pos.x) + Math.abs(cell.y - pos.y) === 1)
      .map((cell) => photoById.get(cell.photoId)?.lab)
      .filter((lab): lab is LabColor => Boolean(lab))

    const reference = neighbors.length > 0
      ? {
          L: average(neighbors.map((lab) => lab.L)),
          a: average(neighbors.map((lab) => lab.a)),
          b: average(neighbors.map((lab) => lab.b)),
        }
      : center

    const nextPhoto = [...available].sort((left, right) => {
      const leftScore = labDistance(left.lab, reference)
      const rightScore = labDistance(right.lab, reference)
      return leftScore - rightScore || left.id.localeCompare(right.id)
    })[0]

    if (!nextPhoto) break
    cells.push({ photoId: nextPhoto.id, x: pos.x, y: pos.y, spanX: 1, spanY: 1 })
    available.splice(available.findIndex((photo) => photo.id === nextPhoto.id), 1)
  }

  return cells
}

function selectCornerPhotos(photos: PhotoMeta[], count: number): PhotoMeta[] {
  if (photos.length <= count) return [...photos]

  const selected: PhotoMeta[] = [photos[0]]

  while (selected.length < count) {
    let best: PhotoMeta | null = null
    let bestMinDist = -1

    for (const candidate of photos) {
      if (selected.some((s) => s.id === candidate.id)) continue

      const minDist = Math.min(...selected.map((s) => labDistance(s.lab, candidate.lab)))
      if (minDist > bestMinDist) {
        bestMinDist = minDist
        best = candidate
      }
    }

    if (!best) break
    selected.push(best)
  }

  return selected
}

function getRadialPositions(grid: GridConfig): Array<{ x: number; y: number }> {
  const centerX = (grid.cols - 1) / 2
  const centerY = (grid.rows - 1) / 2

  return Array.from({ length: grid.cols * grid.rows }, (_, index) => ({
    x: index % grid.cols,
    y: Math.floor(index / grid.cols),
  })).sort((left, right) => {
    const leftDy = left.y - centerY
    const leftDx = left.x - centerX
    const rightDy = right.y - centerY
    const rightDx = right.x - centerX

    const leftRadius = leftDx * leftDx + leftDy * leftDy
    const rightRadius = rightDx * rightDx + rightDy * rightDy
    if (leftRadius !== rightRadius) return leftRadius - rightRadius

    const leftAngle = Math.atan2(leftDy, leftDx)
    const rightAngle = Math.atan2(rightDy, rightDx)
    if (leftAngle !== rightAngle) return leftAngle - rightAngle

    return left.y - right.y || left.x - right.x
  })
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
