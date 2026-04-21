import { describe, it, expect } from "vitest"
import { arrangeByColor, ARRANGE_STRATEGIES } from "../lib/portfolio/arrange-by-color"
import type { PhotoMeta, GridConfig } from "../lib/portfolio/types"

function makePhoto(id: string, L: number, a: number, b: number): PhotoMeta {
  return {
    id,
    filename: `${id}.jpg`,
    width: 100,
    height: 100,
    dominantColor: "#000000",
    lab: { L, a, b },
    uploadedAt: "2024-01-01T00:00:00.000Z",
  }
}

describe("arrangeByColor", () => {
  it("returns empty array for no photos", () => {
    expect(arrangeByColor([], { cols: 4, rows: 4 })).toEqual([])
  })

  it("places all photos when fewer than grid cells", () => {
    const photos = [
      makePhoto("a", 10, 0, 0),
      makePhoto("b", 50, 20, -10),
      makePhoto("c", 80, -5, 30),
    ]
    const grid: GridConfig = { cols: 3, rows: 2 }
    const cells = arrangeByColor(photos, grid)
    expect(cells.length).toBe(3)
    const ids = new Set(cells.map((c) => c.photoId))
    expect(ids.size).toBe(3)
  })

  it("is deterministic — same input gives same output", () => {
    const photos = Array.from({ length: 12 }, (_, i) =>
      makePhoto(`p${i}`, i * 7, i * 3 - 20, i * 2 - 10)
    )
    const grid: GridConfig = { cols: 4, rows: 4 }
    const result1 = arrangeByColor(photos, grid)
    const result2 = arrangeByColor(photos, grid)
    expect(result1).toEqual(result2)
  })

  it("does not place the same photo twice", () => {
    const photos = Array.from({ length: 9 }, (_, i) =>
      makePhoto(`photo-${i}`, i * 5, 0, 0)
    )
    const grid: GridConfig = { cols: 3, rows: 3 }
    const cells = arrangeByColor(photos, grid)
    const ids = cells.map((c) => c.photoId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("all cells have spanX=1, spanY=1", () => {
    const photos = Array.from({ length: 4 }, (_, i) =>
      makePhoto(`s${i}`, i * 20, 0, 0)
    )
    const grid: GridConfig = { cols: 2, rows: 2 }
    const cells = arrangeByColor(photos, grid)
    for (const cell of cells) {
      expect(cell.spanX).toBe(1)
      expect(cell.spanY).toBe(1)
    }
  })

  it("corner photos are maximally color-diverse", () => {
    const black = makePhoto("black", 0, 0, 0)
    const white = makePhoto("white", 100, 0, 0)
    const red = makePhoto("red", 53, 80, 67)
    const blue = makePhoto("blue", 32, 79, -108)
    const mid = makePhoto("mid", 50, 0, 0)
    const photos = [black, white, red, blue, mid]
    const grid: GridConfig = { cols: 3, rows: 3 }
    const cells = arrangeByColor(photos, grid)
    const corners = [
      cells.find((c) => c.x === 0 && c.y === 0),
      cells.find((c) => c.x === 2 && c.y === 0),
      cells.find((c) => c.x === 0 && c.y === 2),
      cells.find((c) => c.x === 2 && c.y === 2),
    ].filter(Boolean)
    expect(corners.length).toBe(4)
    const cornerIds = new Set(corners.map((c) => c!.photoId))
    expect(cornerIds.has("mid")).toBe(false)
  })

  it("cells have valid x/y within grid bounds", () => {
    const photos = Array.from({ length: 6 }, (_, i) =>
      makePhoto(`g${i}`, i * 15, 0, 0)
    )
    const grid: GridConfig = { cols: 3, rows: 3 }
    const cells = arrangeByColor(photos, grid)
    for (const cell of cells) {
      expect(cell.x).toBeGreaterThanOrEqual(0)
      expect(cell.x).toBeLessThan(grid.cols)
      expect(cell.y).toBeGreaterThanOrEqual(0)
      expect(cell.y).toBeLessThan(grid.rows)
    }
  })

  it.each(ARRANGE_STRATEGIES)("is deterministic for strategy %s", (strategy) => {
    const photos = Array.from({ length: 12 }, (_, i) =>
      makePhoto(`p${i}`, i * 6, i * 2 - 10, i * 3 - 12)
    )
    const grid: GridConfig = { cols: 4, rows: 3 }

    const result1 = arrangeByColor(photos, grid, strategy)
    const result2 = arrangeByColor(photos, grid, strategy)

    expect(result1).toEqual(result2)
  })

  it.each(ARRANGE_STRATEGIES)("does not place duplicates for strategy %s", (strategy) => {
    const photos = Array.from({ length: 8 }, (_, i) =>
      makePhoto(`photo-${i}`, i * 11, i - 4, 8 - i)
    )
    const grid: GridConfig = { cols: 4, rows: 3 }
    const cells = arrangeByColor(photos, grid, strategy)
    const ids = cells.map((cell) => cell.photoId)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it("lightness strategy builds monotonic row flow", () => {
    const photos = [
      makePhoto("p1", 10, 0, 0),
      makePhoto("p2", 20, 0, 0),
      makePhoto("p3", 30, 0, 0),
      makePhoto("p4", 40, 0, 0),
    ]
    const grid: GridConfig = { cols: 2, rows: 2 }
    const cells = arrangeByColor(photos, grid, "lightness")
    const byPosition = [...cells].sort((left, right) => left.y - right.y || left.x - right.x)

    expect(byPosition.map((cell) => cell.photoId)).toEqual(["p1", "p2", "p4", "p3"])
  })
})
