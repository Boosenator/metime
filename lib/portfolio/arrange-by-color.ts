import type { PhotoMeta, GridConfig, Cell, LabColor } from "./types"
import { labDistance } from "./color-utils"

export const ARRANGE_STRATEGIES = ["neighbors", "lightness", "radial"] as const

export type ArrangeStrategy = (typeof ARRANGE_STRATEGIES)[number]

export function arrangeByColor(
  photos: PhotoMeta[],
  grid: GridConfig,
  strategy: ArrangeStrategy = "neighbors",
  existingCells: Cell[] = []
): Cell[] {
  const activePhotos = photos.filter((photo) => !photo.excluded)
  if (activePhotos.length === 0) return []

  const lockedCells = existingCells.filter((cell) => cell.locked && fitsInGrid(cell, grid))
  const lockedPhotoIds = new Set(lockedCells.map((cell) => cell.photoId))
  const availablePhotos = activePhotos.filter((photo) => !lockedPhotoIds.has(photo.id))

  if (strategy === "lightness") {
    return arrangeByLightnessBands(activePhotos, availablePhotos, grid, lockedCells)
  }

  if (strategy === "radial") {
    return arrangeByRadialNeighbors(activePhotos, availablePhotos, grid, lockedCells)
  }

  return arrangeByNeighborSimilarity(activePhotos, availablePhotos, grid, lockedCells)
}

function arrangeByNeighborSimilarity(
  allPhotos: PhotoMeta[],
  availablePhotos: PhotoMeta[],
  grid: GridConfig,
  lockedCells: Cell[]
): Cell[] {
  const totalCells = grid.cols * grid.rows
  const cells: (Cell | null)[] = new Array(totalCells).fill(null)
  const placed = new Set<string>()
  const photoById = new Map(allPhotos.map((photo) => [photo.id, photo]))

  const idx = (x: number, y: number) => y * grid.cols + x

  for (const locked of lockedCells) {
    placeCell(cells, locked, grid)
    placed.add(locked.photoId)
  }

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
        const photo = photoById.get(cell.photoId)
        if (photo) neighbors.push(photo.lab)
      }
    }
    return neighbors
  }

  const neighborScore = (lab: LabColor, x: number, y: number): number => {
    const neighbors = getNeighborLabs(x, y)
    if (neighbors.length === 0) return 0
    return neighbors.reduce((sum, neighbor) => sum + labDistance(lab, neighbor), 0) / neighbors.length
  }

  const corners = selectCornerPhotos(availablePhotos, 4)
  const cornerPositions = [
    { x: 0, y: 0 },
    { x: grid.cols - 1, y: 0 },
    { x: 0, y: grid.rows - 1 },
    { x: grid.cols - 1, y: grid.rows - 1 },
  ]

  for (let i = 0; i < corners.length && i < cornerPositions.length; i++) {
    const pos = cornerPositions[i]
    if (cells[idx(pos.x, pos.y)] !== null) continue
    const photo = corners[i]
    const nextCell: Cell = { photoId: photo.id, x: pos.x, y: pos.y, spanX: 1, spanY: 1 }
    placeCell(cells, nextCell, grid)
    placed.add(photo.id)
  }

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (cells[idx(x, y)] !== null) continue

      const available = availablePhotos.filter((photo) => !placed.has(photo.id))
      if (available.length === 0) break

      const best = available.reduce((bestPhoto, candidate) => {
        const scoreA = neighborScore(bestPhoto.lab, x, y)
        const scoreB = neighborScore(candidate.lab, x, y)
        return scoreB < scoreA ? candidate : bestPhoto
      })

      const nextCell: Cell = { photoId: best.id, x, y, spanX: 1, spanY: 1 }
      placeCell(cells, nextCell, grid)
      placed.add(best.id)
    }
  }

  return cells.filter((cell, index): cell is Cell => {
    if (!cell) return false
    return idx(cell.x, cell.y) === index
  })
}

function arrangeByLightnessBands(
  allPhotos: PhotoMeta[],
  availablePhotos: PhotoMeta[],
  grid: GridConfig,
  lockedCells: Cell[]
): Cell[] {
  const cells = [...lockedCells]
  const occupied = buildOccupiedSet(lockedCells, grid)
  const sorted = [...availablePhotos].sort((a, b) => {
    if (a.lab.L !== b.lab.L) return a.lab.L - b.lab.L
    if (a.lab.a !== b.lab.a) return a.lab.a - b.lab.a
    if (a.lab.b !== b.lab.b) return a.lab.b - b.lab.b
    return a.id.localeCompare(b.id)
  })

  let photoIndex = 0
  for (let y = 0; y < grid.rows; y++) {
    const xPositions = Array.from({ length: grid.cols }, (_, i) => i)
    if (y % 2 === 1) xPositions.reverse()

    for (const x of xPositions) {
      if (occupied.has(cellKey(x, y))) continue
      const photo = sorted[photoIndex++]
      if (!photo) return sortCells(cells)
      cells.push({ photoId: photo.id, x, y, spanX: 1, spanY: 1 })
    }
  }

  return sortCells(cells)
}

function arrangeByRadialNeighbors(
  allPhotos: PhotoMeta[],
  availablePhotos: PhotoMeta[],
  grid: GridConfig,
  lockedCells: Cell[]
): Cell[] {
  const cells: Cell[] = [...lockedCells]
  const occupied = buildOccupiedSet(lockedCells, grid)
  const positions = getRadialPositions(grid).filter((pos) => !occupied.has(cellKey(pos.x, pos.y)))
  if (positions.length === 0) return sortCells(cells)

  const available = [...availablePhotos]
  const photoById = new Map(allPhotos.map((photo) => [photo.id, photo]))

  const center = {
    L: average(allPhotos.map((photo) => photo.lab.L)),
    a: average(allPhotos.map((photo) => photo.lab.a)),
    b: average(allPhotos.map((photo) => photo.lab.b)),
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const neighbors = cells
      .filter((cell) => touchesCell(cell, pos.x, pos.y))
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

  return sortCells(cells)
}

function selectCornerPhotos(photos: PhotoMeta[], count: number): PhotoMeta[] {
  if (photos.length <= count) return [...photos]

  const selected: PhotoMeta[] = [photos[0]]

  while (selected.length < count) {
    let best: PhotoMeta | null = null
    let bestMinDist = -1

    for (const candidate of photos) {
      if (selected.some((photo) => photo.id === candidate.id)) continue

      const minDist = Math.min(...selected.map((photo) => labDistance(photo.lab, candidate.lab)))
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

function cellKey(x: number, y: number) {
  return `${x},${y}`
}

function fitsInGrid(cell: Cell, grid: GridConfig) {
  return cell.x >= 0 && cell.y >= 0 && cell.x + cell.spanX <= grid.cols && cell.y + cell.spanY <= grid.rows
}

function placeCell(cells: (Cell | null)[], cell: Cell, grid: GridConfig) {
  for (let dy = 0; dy < cell.spanY; dy++) {
    for (let dx = 0; dx < cell.spanX; dx++) {
      const x = cell.x + dx
      const y = cell.y + dy
      cells[y * grid.cols + x] = cell
    }
  }
}

function buildOccupiedSet(cells: Cell[], grid: GridConfig) {
  const occupied = new Set<string>()
  for (const cell of cells) {
    for (let dy = 0; dy < cell.spanY; dy++) {
      for (let dx = 0; dx < cell.spanX; dx++) {
        const x = cell.x + dx
        const y = cell.y + dy
        if (x < grid.cols && y < grid.rows) {
          occupied.add(cellKey(x, y))
        }
      }
    }
  }
  return occupied
}

function touchesCell(cell: Cell, x: number, y: number) {
  return x >= cell.x - 1 &&
    x <= cell.x + cell.spanX &&
    y >= cell.y - 1 &&
    y <= cell.y + cell.spanY &&
    !(
      x >= cell.x &&
      x < cell.x + cell.spanX &&
      y >= cell.y &&
      y < cell.y + cell.spanY
    )
}

function sortCells(cells: Cell[]) {
  return [...cells].sort((left, right) => left.y - right.y || left.x - right.x || left.photoId.localeCompare(right.photoId))
}
