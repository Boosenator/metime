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
  type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { Save, RotateCcw, Wand2, Upload, Grid2x2, Loader2, X } from "lucide-react"
import type { PhotoMeta, LayoutData, Cell, GridConfig } from "@/lib/portfolio/types"
import { arrangeByColor } from "@/lib/portfolio/arrange-by-color"

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── Pool thumbnail (unplaced) ────────────────────────────────────────────────

function PoolThumb({ photo, id }: { photo: PhotoMeta; id: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${id}`,
    data: { type: "pool", photoId: id },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`aspect-square cursor-grab overflow-hidden rounded border border-white/10 transition-opacity ${
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

// ─── Drop target cell ─────────────────────────────────────────────────────────

function DropCell({ x, y, occupied }: { x: number; y: number; occupied: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${x},${y}`,
    data: { x, y },
  })
  return (
    <div
      ref={setNodeRef}
      className="transition-colors"
      style={{
        gridColumn: String(x + 1),
        gridRow: String(y + 1),
        backgroundColor: isOver
          ? occupied
            ? "rgba(139,26,46,0.25)"
            : "rgba(139,26,46,0.15)"
          : "transparent",
      }}
    />
  )
}

// ─── Placed photo — same visual as public mosaic ──────────────────────────────

function PlacedCard({
  cell,
  photo,
  selected,
  onSelect,
  onStartResize,
  onRemove,
}: {
  cell: Cell
  photo: PhotoMeta
  selected: boolean
  onSelect: () => void
  onStartResize: (e: ReactPointerEvent<HTMLDivElement>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${cell.photoId}`,
    data: { type: "placed", photoId: cell.photoId, cell },
  })
  const src = `/images/portfolio/${photo.filename}`

  return (
    <div
      ref={setNodeRef}
      className="group relative cursor-grab overflow-hidden"
      style={{
        gridColumn: `${cell.x + 1} / span ${cell.spanX}`,
        gridRow: `${cell.y + 1} / span ${cell.spanY}`,
        opacity: isDragging ? 0.35 : 1,
        outline: selected ? "2px solid rgba(139,26,46,0.9)" : undefined,
        outlineOffset: selected ? "-2px" : undefined,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
    >
      {/* Blurred background — same as public mosaic */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45 blur-xl scale-110 pointer-events-none"
        draggable={false}
        aria-hidden="true"
      />
      {/* Main image */}
      <img
        src={src}
        alt={photo.filename}
        className="relative z-[1] h-full w-full object-cover"
        draggable={false}
      />
      {/* Hover gradient */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {/* Admin controls — shown on hover */}
      <div className="absolute inset-x-0 top-0 z-[3] flex items-center justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="rounded bg-black/60 p-1 text-cream/80 hover:text-red-400 transition-colors"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Resize handle — bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 z-[3] h-5 w-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "linear-gradient(135deg, transparent 50%, rgba(139,26,46,0.85) 50%)" }}
        onPointerDown={(e) => { e.stopPropagation(); onStartResize(e) }}
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
    cellW: number
    cellH: number
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

  const ROW_H = 120 // px per row — same visual density as public mosaic

  // ── Grid size ─────────────────────────────────────────────────────────────

  const applyGridSize = useCallback(() => {
    const cols = Math.max(1, Math.min(40, parseInt(colsInput) || 12))
    const rows = Math.max(1, Math.min(40, parseInt(rowsInput) || 24))
    setColsInput(String(cols))
    setRowsInput(String(rows))
    setLayout((prev) => ({
      ...prev,
      grid: { cols, rows },
      cells: prev.cells
        .filter((c) => c.x < cols && c.y < rows)
        .map((c) => ({ ...c, spanX: Math.min(c.spanX, cols - c.x), spanY: Math.min(c.spanY, rows - c.y) })),
    }))
  }, [colsInput, rowsInput])

  // ── Auto arrange ──────────────────────────────────────────────────────────

  const autoArrange = useCallback(() => {
    setLayout((prev) => ({ ...prev, cells: arrangeByColor(photos, prev.grid) }))
  }, [photos])

  // ── DnD ──────────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const targetId = String(over.id)
    if (!targetId.startsWith("cell:")) return
    const [, coords] = targetId.split("cell:")
    const [tx, ty] = coords.split(",").map(Number)
    const { photoId } = active.data.current as { photoId: string; cell?: Cell }

    setLayout((prev) => {
      const cells = [...prev.cells]
      const grid = prev.grid
      const movingCell = cells.find((c) => c.photoId === photoId)
      const newCell: Cell = movingCell
        ? { ...movingCell, x: tx, y: ty }
        : { photoId, x: tx, y: ty, spanX: 1, spanY: 1 }
      if (!canFit(newCell, grid)) return prev

      const occ = buildOccupancyMap(cells, grid)
      const displaced = new Set<string>()
      for (let dy = 0; dy < newCell.spanY; dy++)
        for (let dx = 0; dx < newCell.spanX; dx++) {
          const hit = occ.get(cellKey(tx + dx, ty + dy))
          if (hit && hit.photoId !== photoId) displaced.add(hit.photoId)
        }

      let next = cells.filter((c) => c.photoId !== photoId && !displaced.has(c.photoId))
      if (displaced.size === 1 && movingCell) {
        const [dId] = displaced
        const dc = cells.find((c) => c.photoId === dId)!
        if (canFit({ ...dc, x: movingCell.x, y: movingCell.y }, grid))
          next.push({ ...dc, x: movingCell.x, y: movingCell.y })
      }
      next.push(newCell)
      return { ...prev, cells: next }
    })
  }, [])

  // ── Resize ────────────────────────────────────────────────────────────────

  const startResize = useCallback((e: ReactPointerEvent<HTMLDivElement>, cell: Cell) => {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    resizingRef.current = {
      cell,
      startX: e.clientX,
      startY: e.clientY,
      cellW: rect.width / layout.grid.cols,
      cellH: rect.height / layout.grid.rows,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [layout.grid])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!resizingRef.current) return
      const { cell, startX, startY, cellW, cellH } = resizingRef.current
      const spanX = Math.max(1, Math.round(cell.spanX + (e.clientX - startX) / cellW))
      const spanY = Math.max(1, Math.round(cell.spanY + (e.clientY - startY) / cellH))
      setLayout((prev) => {
        const grid = prev.grid
        const updated: Cell = {
          ...cell,
          spanX: Math.min(spanX, grid.cols - cell.x),
          spanY: Math.min(spanY, grid.rows - cell.y),
        }
        const others = prev.cells.filter((c) => c.photoId !== cell.photoId)
        const occ = buildOccupancyMap(others, grid)
        const displaced = new Set<string>()
        for (let dy = 0; dy < updated.spanY; dy++)
          for (let dx = 0; dx < updated.spanX; dx++) {
            const hit = occ.get(cellKey(updated.x + dx, updated.y + dy))
            if (hit) displaced.add(hit.photoId)
          }
        return { ...prev, cells: [...others.filter((c) => !displaced.has(c.photoId)), updated] }
      })
    }
    function onUp() { resizingRef.current = null }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp) }
  }, [])

  // ── Save / Discard ────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true); setSaveMsg(null)
    try {
      const res = await fetch("/api/admin/portfolio/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedLayout(layout)
      setSaveMsg("Збережено!")
    } catch (err) {
      setSaveMsg(`Помилка: ${err instanceof Error ? err.message : "unknown"}`)
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
    const fd = new FormData()
    for (const f of files) fd.append("files", f)
    try {
      const res = await fetch("/api/admin/portfolio/upload", { method: "POST", body: fd })
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

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-white/10 bg-dark/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Grid2x2 className="h-4 w-4 text-gray-mid" />
          <input
            type="number" min={1} max={40} value={colsInput}
            onChange={(e) => setColsInput(e.target.value)}
            onBlur={applyGridSize}
            onKeyDown={(e) => e.key === "Enter" && applyGridSize()}
            className="w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
            title="Колонки"
          />
          <span className="text-gray-mid">×</span>
          <input
            type="number" min={1} max={40} value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            onBlur={applyGridSize}
            onKeyDown={(e) => e.key === "Enter" && applyGridSize()}
            className="w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
            title="Рядки"
          />
        </div>

        <button onClick={autoArrange}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/20 transition-colors">
          <Wand2 className="h-3.5 w-3.5" /> Auto-arrange
        </button>

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/20 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleUpload(e.target.files)} />

        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span className={`text-xs ${saveMsg.startsWith("П") ? "text-red-400" : "text-green-400"}`}>
              {saveMsg}
            </span>
          )}
          <button onClick={discard} disabled={!isDirty}
            className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-white/10 transition-colors disabled:opacity-30">
            <RotateCcw className="h-3.5 w-3.5" /> Discard
          </button>
          <button onClick={save} disabled={!isDirty || saving}
            className="flex items-center gap-1.5 rounded bg-wine px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-wine/80 transition-colors disabled:opacity-30">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Grid */}
          <div className="relative flex-1 overflow-auto bg-dark" onClick={() => setSelected(null)}>
            <style>{`
              .admin-mosaic-grid {
                display: grid;
                grid-template-columns: repeat(${layout.grid.cols}, minmax(0, 1fr));
                grid-template-rows: repeat(${layout.grid.rows}, ${ROW_H}px);
              }
            `}</style>
            <div ref={gridRef} className="admin-mosaic-grid">

              {/* Drop zone cells (transparent, only coloured on drag-over) */}
              {Array.from({ length: layout.grid.rows }, (_, y) =>
                Array.from({ length: layout.grid.cols }, (_, x) => (
                  <DropCell key={`${x},${y}`} x={x} y={y} occupied={occupancy.has(cellKey(x, y))} />
                ))
              )}

              {/* Placed photos — same visual as public mosaic */}
              {layout.cells.map((cell) => {
                const photo = photoMap.get(cell.photoId)
                if (!photo) return null
                return (
                  <PlacedCard
                    key={cell.photoId}
                    cell={cell}
                    photo={photo}
                    selected={selected === cell.photoId}
                    onSelect={() => setSelected(cell.photoId)}
                    onStartResize={(e) => startResize(e, cell)}
                    onRemove={() => setLayout((prev) => ({
                      ...prev,
                      cells: prev.cells.filter((c) => c.photoId !== cell.photoId),
                    }))}
                  />
                )
              })}
            </div>
          </div>

          {/* Unplaced pool */}
          <div className="flex w-44 flex-shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-dark/90 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-mid">
              Не розміщено ({unplaced.length})
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {unplaced.map((photo) => (
                <PoolThumb key={photo.id} photo={photo} id={photo.id} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay />
      </DndContext>
    </div>
  )
}
