"use client"

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { Save, RotateCcw, Wand2, Upload, Grid2x2, Loader2, X } from "lucide-react"
import type { PhotoMeta, LayoutData, Cell, GridConfig } from "@/lib/portfolio/types"
import { arrangeByColor } from "@/lib/portfolio/arrange-by-color"

// ─── helpers ─────────────────────────────────────────────────────────────────

function cellKey(x: number, y: number) {
  return `${x},${y}`
}

function buildOccupancyMap(cells: Cell[], grid: GridConfig): Map<string, Cell> {
  const map = new Map<string, Cell>()
  for (const cell of cells) {
    for (let dy = 0; dy < cell.spanY; dy++) {
      for (let dx = 0; dx < cell.spanX; dx++) {
        const x = cell.x + dx
        const y = cell.y + dy
        if (x < grid.cols && y < grid.rows) {
          map.set(cellKey(x, y), cell)
        }
      }
    }
  }
  return map
}

function canFit(cell: Cell, grid: GridConfig): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x + cell.spanX <= grid.cols &&
    cell.y + cell.spanY <= grid.rows
  )
}

// ─── Draggable photo thumbnail (from unplaced pool) ──────────────────────────

function PoolThumb({
  photo,
  id,
}: {
  photo: PhotoMeta
  id: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${id}`,
    data: { type: "pool", photoId: id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`aspect-square cursor-grab overflow-hidden rounded border border-white/10 bg-dark-card/60 transition-opacity ${
        isDragging ? "opacity-30" : "opacity-100"
      }`}
    >
      <img
        src={`/images/portfolio/${photo.filename}`}
        alt={photo.filename}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  )
}

// ─── Grid cell drop target ────────────────────────────────────────────────────

function GridDropCell({
  x,
  y,
  occupied,
}: {
  x: number
  y: number
  occupied: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${x},${y}`,
    data: { x, y },
  })

  return (
    <div
      ref={setNodeRef}
      className={`border border-white/6 transition-colors ${
        isOver
          ? occupied
            ? "bg-red-900/20"
            : "bg-wine/20"
          : "bg-transparent"
      }`}
      style={{ gridColumn: `${x + 1}`, gridRow: `${y + 1}` }}
    />
  )
}

// ─── Placed photo card ────────────────────────────────────────────────────────

function PlacedCard({
  cell,
  photo,
  selected,
  onSelect,
  onStartResize,
}: {
  cell: Cell
  photo: PhotoMeta
  selected: boolean
  onSelect: () => void
  onStartResize: (e: ReactPointerEvent) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${cell.photoId}`,
    data: { type: "placed", photoId: cell.photoId, cell },
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 cursor-grab overflow-hidden ${
        isDragging ? "opacity-40" : "opacity-100"
      } ${selected ? "ring-2 ring-wine ring-offset-1 ring-offset-dark" : ""}`}
      style={
        {
          gridColumn: `${cell.x + 1} / span ${cell.spanX}`,
          gridRow: `${cell.y + 1} / span ${cell.spanY}`,
          pointerEvents: isDragging ? "none" : undefined,
        } as CSSProperties
      }
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <img
        src={`/images/portfolio/${photo.filename}`}
        alt={photo.filename}
        className="h-full w-full object-cover"
        draggable={false}
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-se-resize bg-wine/80"
        onPointerDown={(e) => {
          e.stopPropagation()
          onStartResize(e)
        }}
        title="Resize"
      />
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function AdminPortfolioEditor({
  initialPhotos,
  initialLayout,
}: {
  initialPhotos: PhotoMeta[]
  initialLayout: LayoutData
}) {
  const [photos] = useState<PhotoMeta[]>(initialPhotos)
  const [layout, setLayout] = useState<LayoutData>(initialLayout)
  const [savedLayout, setSavedLayout] = useState<LayoutData>(initialLayout)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [colsInput, setColsInput] = useState(String(initialLayout.grid.cols))
  const [rowsInput, setRowsInput] = useState(String(initialLayout.grid.rows))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gridRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<{
    cell: Cell
    startX: number
    startY: number
    originCellW: number
    originCellH: number
  } | null>(null)

  const isDirty =
    JSON.stringify(layout.cells) !== JSON.stringify(savedLayout.cells) ||
    layout.grid.cols !== savedLayout.grid.cols ||
    layout.grid.rows !== savedLayout.grid.rows

  const photoMap = new Map(photos.map((p) => [p.id, p]))

  const placedIds = new Set(layout.cells.map((c) => c.photoId))
  const unplaced = photos.filter((p) => !placedIds.has(p.id))

  const occupancy = buildOccupancyMap(layout.cells, layout.grid)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // ── Grid size ─────────────────────────────────────────────────────────────

  const applyGridSize = useCallback(() => {
    const cols = Math.max(1, Math.min(40, parseInt(colsInput) || 12))
    const rows = Math.max(1, Math.min(40, parseInt(rowsInput) || 24))
    setColsInput(String(cols))
    setRowsInput(String(rows))

    setLayout((prev) => {
      const clipped = prev.cells.filter(
        (c) => c.x < cols && c.y < rows
      ).map((c) => ({
        ...c,
        spanX: Math.min(c.spanX, cols - c.x),
        spanY: Math.min(c.spanY, rows - c.y),
      }))
      return { ...prev, grid: { cols, rows }, cells: clipped }
    })
  }, [colsInput, rowsInput])

  // ── Auto arrange ──────────────────────────────────────────────────────────

  const autoArrange = useCallback(() => {
    const cells = arrangeByColor(photos, layout.grid)
    setLayout((prev) => ({ ...prev, cells }))
  }, [photos, layout.grid])

  // ── DnD ──────────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const targetId = String(over.id)
      if (!targetId.startsWith("cell:")) return

      const [, coords] = targetId.split("cell:")
      const [tx, ty] = coords.split(",").map(Number)

      const activeData = active.data.current as { type: string; photoId: string; cell?: Cell }
      const { photoId } = activeData

      setLayout((prev) => {
        const cells = [...prev.cells]
        const grid = prev.grid

        const movingCell = cells.find((c) => c.photoId === photoId)
        const newCell: Cell = movingCell
          ? { ...movingCell, x: tx, y: ty }
          : { photoId, x: tx, y: ty, spanX: 1, spanY: 1 }

        if (!canFit(newCell, grid)) return prev

        const occupancyMap = buildOccupancyMap(cells, grid)
        const displaced = new Set<string>()

        for (let dy = 0; dy < newCell.spanY; dy++) {
          for (let dx = 0; dx < newCell.spanX; dx++) {
            const existing = occupancyMap.get(cellKey(tx + dx, ty + dy))
            if (existing && existing.photoId !== photoId) {
              displaced.add(existing.photoId)
            }
          }
        }

        let next = cells.filter((c) => c.photoId !== photoId && !displaced.has(c.photoId))

        // Try to swap: move displaced to original position of dragged cell
        if (displaced.size === 1 && movingCell) {
          const [displacedId] = displaced
          const displacedCell = cells.find((c) => c.photoId === displacedId)!
          if (
            canFit({ ...displacedCell, x: movingCell.x, y: movingCell.y }, grid)
          ) {
            next.push({ ...displacedCell, x: movingCell.x, y: movingCell.y })
          }
        }

        next.push(newCell)
        return { ...prev, cells: next }
      })
    },
    []
  )

  // ── Resize ────────────────────────────────────────────────────────────────

  const startResize = useCallback((e: ReactPointerEvent, cell: Cell) => {
    if (!gridRef.current) return
    const gridRect = gridRef.current.getBoundingClientRect()
    const cellW = gridRect.width / layout.grid.cols
    const cellH = gridRect.height / layout.grid.rows
    resizingRef.current = {
      cell,
      startX: e.clientX,
      startY: e.clientY,
      originCellW: cellW,
      originCellH: cellH,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [layout.grid])

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!resizingRef.current) return
      const { cell, startX, startY, originCellW, originCellH } = resizingRef.current

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      const newSpanX = Math.max(1, Math.round(cell.spanX + deltaX / originCellW))
      const newSpanY = Math.max(1, Math.round(cell.spanY + deltaY / originCellH))

      setLayout((prev) => {
        const grid = prev.grid
        const clampedSpanX = Math.min(newSpanX, grid.cols - cell.x)
        const clampedSpanY = Math.min(newSpanY, grid.rows - cell.y)

        const updatedCell: Cell = {
          ...cell,
          spanX: clampedSpanX,
          spanY: clampedSpanY,
        }

        const others = prev.cells.filter((c) => c.photoId !== cell.photoId)
        const map = buildOccupancyMap(others, grid)
        const displaced = new Set<string>()

        for (let dy = 0; dy < updatedCell.spanY; dy++) {
          for (let dx = 0; dx < updatedCell.spanX; dx++) {
            const hit = map.get(cellKey(updatedCell.x + dx, updatedCell.y + dy))
            if (hit) displaced.add(hit.photoId)
          }
        }

        const remaining = others.filter((c) => !displaced.has(c.photoId))
        return { ...prev, cells: [...remaining, updatedCell] }
      })
    }

    function onPointerUp() {
      resizingRef.current = null
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/admin/portfolio/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedLayout(layout)
      setSaveMsg("Saved!")
    } catch (err) {
      setSaveMsg(`Error: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setSaving(false)
    }
  }, [layout])

  const discard = useCallback(() => {
    setLayout(savedLayout)
    setColsInput(String(savedLayout.grid.cols))
    setRowsInput(String(savedLayout.grid.rows))
  }, [savedLayout])

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const formData = new FormData()
    for (const file of files) formData.append("files", file)
    try {
      const res = await fetch("/api/admin/portfolio/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error(await res.text())
      window.location.reload()
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setUploading(false)
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dark text-cream">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-white/10 bg-dark/95 px-4 py-3">
        {/* Grid size */}
        <div className="flex items-center gap-1.5">
          <Grid2x2 className="h-4 w-4 text-gray-mid" />
          <input
            type="number"
            min={1}
            max={40}
            value={colsInput}
            onChange={(e) => setColsInput(e.target.value)}
            onBlur={applyGridSize}
            onKeyDown={(e) => e.key === "Enter" && applyGridSize()}
            className="w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
            title="Columns"
          />
          <span className="text-gray-mid">×</span>
          <input
            type="number"
            min={1}
            max={40}
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            onBlur={applyGridSize}
            onKeyDown={(e) => e.key === "Enter" && applyGridSize()}
            className="w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
            title="Rows"
          />
        </div>

        <button
          onClick={autoArrange}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/20 transition-colors"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Auto-arrange
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/20 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span
              className={`text-xs ${saveMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
            >
              {saveMsg}
            </span>
          )}
          <button
            onClick={discard}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </button>
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 rounded bg-wine px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/80 transition-colors disabled:opacity-30"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Body: grid + pool */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Grid editor */}
          <div
            className="relative flex-1 overflow-auto"
            onClick={() => setSelected(null)}
          >
            <div
              ref={gridRef}
              className="relative"
              style={
                {
                  display: "grid",
                  gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${layout.grid.rows}, minmax(60px, 1fr))`,
                  minHeight: `${layout.grid.rows * 60}px`,
                } as CSSProperties
              }
            >
              {/* Drop targets */}
              {Array.from({ length: layout.grid.rows }, (_, y) =>
                Array.from({ length: layout.grid.cols }, (_, x) => (
                  <GridDropCell
                    key={`${x},${y}`}
                    x={x}
                    y={y}
                    occupied={occupancy.has(cellKey(x, y))}
                  />
                ))
              )}

              {/* Placed photos overlay */}
              {layout.cells.map((cell) => {
                const photo = photoMap.get(cell.photoId)
                if (!photo) return null
                return (
                  <div
                    key={cell.photoId}
                    className="relative"
                    style={{
                      gridColumn: `${cell.x + 1} / span ${cell.spanX}`,
                      gridRow: `${cell.y + 1} / span ${cell.spanY}`,
                    }}
                  >
                    <PlacedCard
                      cell={cell}
                      photo={photo}
                      selected={selected === cell.photoId}
                      onSelect={() => setSelected(cell.photoId)}
                      onStartResize={(e) => startResize(e, cell)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setLayout((prev) => ({
                          ...prev,
                          cells: prev.cells.filter((c) => c.photoId !== cell.photoId),
                        }))
                      }}
                      className="absolute right-6 top-1 z-20 rounded bg-black/50 p-0.5 text-cream/70 hover:text-red-400 transition-colors"
                      title="Remove from grid"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Unplaced pool */}
          <div className="flex w-44 flex-shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-dark/80 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-mid">
              Unplaced ({unplaced.length})
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {unplaced.map((photo) => (
                <PoolThumb key={photo.id} photo={photo} id={photo.id} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {/* Empty — dnd-kit handles the overlay position; custom preview not needed */}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
