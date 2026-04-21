/**
 * Generate /data/portfolio/layout.json using color-clustering algorithm.
 * Run: node scripts/generate-layout.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const PHOTOS_JSON = join(process.cwd(), "data", "portfolio", "photos.json")
const LAYOUT_JSON = join(process.cwd(), "data", "portfolio", "layout.json")

function labDistance(a, b) {
  return Math.sqrt(Math.pow(a.L - b.L, 2) + Math.pow(a.a - b.a, 2) + Math.pow(a.b - b.b, 2))
}

function selectCornerPhotos(photos, count) {
  if (photos.length <= count) return [...photos]
  const selected = [photos[0]]
  while (selected.length < count) {
    let best = null, bestMinDist = -1
    for (const candidate of photos) {
      if (selected.some(s => s.id === candidate.id)) continue
      const minDist = Math.min(...selected.map(s => labDistance(s.lab, candidate.lab)))
      if (minDist > bestMinDist) { bestMinDist = minDist; best = candidate }
    }
    if (!best) break
    selected.push(best)
  }
  return selected
}

function arrangeByColor(photos, grid) {
  if (photos.length === 0) return []
  const totalCells = grid.cols * grid.rows
  const cells = new Array(totalCells).fill(null)
  const placed = new Set()
  const idx = (x, y) => y * grid.cols + x

  const getNeighborLabs = (x, y) => {
    const neighbors = []
    for (const [dx, dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
      const nx = x+dx, ny = y+dy
      if (nx < 0 || nx >= grid.cols || ny < 0 || ny >= grid.rows) continue
      const cell = cells[idx(nx, ny)]
      if (cell) {
        const photo = photos.find(p => p.id === cell.photoId)
        if (photo) neighbors.push(photo.lab)
      }
    }
    return neighbors
  }

  const neighborScore = (lab, x, y) => {
    const neighbors = getNeighborLabs(x, y)
    if (neighbors.length === 0) return 0
    return neighbors.reduce((sum, n) => sum + labDistance(lab, n), 0) / neighbors.length
  }

  const corners = selectCornerPhotos(photos, 4)
  const cornerPositions = [
    {x:0, y:0}, {x:grid.cols-1, y:0},
    {x:0, y:grid.rows-1}, {x:grid.cols-1, y:grid.rows-1},
  ]
  for (let i = 0; i < corners.length && i < cornerPositions.length; i++) {
    const pos = cornerPositions[i]
    cells[idx(pos.x, pos.y)] = { photoId: corners[i].id, x: pos.x, y: pos.y, spanX: 1, spanY: 1 }
    placed.add(corners[i].id)
  }

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (cells[idx(x, y)] !== null) continue
      const available = photos.filter(p => !placed.has(p.id))
      if (available.length === 0) break
      const best = available.reduce((bestPhoto, candidate) => {
        return neighborScore(candidate.lab, x, y) < neighborScore(bestPhoto.lab, x, y) ? candidate : bestPhoto
      })
      cells[idx(x, y)] = { photoId: best.id, x, y, spanX: 1, spanY: 1 }
      placed.add(best.id)
    }
  }

  return cells.filter(c => c !== null)
}

const photos = JSON.parse(readFileSync(PHOTOS_JSON, "utf8"))
const grid = { cols: 12, rows: 24 }
const cells = arrangeByColor(photos, grid)

const layout = {
  grid,
  cells,
  version: 1,
  updatedAt: new Date().toISOString(),
}

writeFileSync(LAYOUT_JSON, JSON.stringify(layout, null, 2), "utf8")
console.log(`Generated layout: ${cells.length} cells placed (grid ${grid.cols}×${grid.rows})`)
