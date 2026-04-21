import type { PhotoMeta, GridConfig, Cell, LabColor } from "./types"
import { labDistance } from "./color-utils"

export function arrangeByColor(photos: PhotoMeta[], grid: GridConfig): Cell[] {
  if (photos.length === 0) return []

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
