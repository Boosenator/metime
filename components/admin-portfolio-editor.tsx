"use client"

import {
  useState,
  useRef,
  useCallback,
  useEffect,
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
import {
  Ban,
  Expand,
  FolderKanban,
  Grid2x2,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react"
import { createPortal } from "react-dom"
import { getPortfolioImageSrc } from "@/lib/portfolio/image-src"
import type { PhotoMeta, LayoutData, Cell, GridConfig } from "@/lib/portfolio/types"
import {
  ARRANGE_STRATEGIES,
  arrangeByColor,
  type ArrangeStrategy,
} from "@/lib/portfolio/arrange-by-color"

const PHOTO_CATEGORIES = [
  "dance",
  "wedding",
  "kids",
  "brand",
  "custom",
  "lovestory",
  "portrait",
] as const

const PHOTO_CATEGORY_LABELS: Record<(typeof PHOTO_CATEGORIES)[number], string> = {
  dance: "Dance",
  wedding: "Wedding",
  kids: "Kids",
  brand: "Brand",
  custom: "Custom",
  lovestory: "Love Story",
  portrait: "Portrait",
}

function normalizePhotoCategory(category?: string): (typeof PHOTO_CATEGORIES)[number] {
  if (category === "commercial" || category === "brand") return "brand"
  if (category === "dance" || category === "wedding" || category === "kids" || category === "custom" || category === "lovestory" || category === "portrait") {
    return category
  }
  return "custom"
}

type AdminTab = "layout" | "library"

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

function PoolThumb({
  photo,
  id,
  excluded,
  onExcludeToggle,
  onDelete,
  onPreview,
}: {
  photo: PhotoMeta
  id: string
  excluded: boolean
  onExcludeToggle: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${id}`,
    data: { type: "pool", photoId: id },
    disabled: excluded,
  })

  return (
    <div
      ref={setNodeRef}
      {...(excluded ? {} : listeners)}
      {...(excluded ? {} : attributes)}
      className={`relative aspect-square overflow-hidden rounded border border-white/10 transition-opacity ${
        excluded ? "cursor-default opacity-45" : `cursor-grab ${isDragging ? "opacity-30" : "opacity-100"}`
      }`}
    >
      <img
        src={getPortfolioImageSrc(photo)}
        alt={photo.filename}
        className="h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-1">
        <button
          type="button"
          onClick={onPreview}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-cream"
          title="Open full size"
        >
          <Expand className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onExcludeToggle}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-amber-300"
          title={excluded ? "Include in portfolio" : "Exclude from portfolio"}
        >
          {excluded ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-red-400"
          title="Delete photo"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

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

function PlacedCard({
  cell,
  photo,
  selected,
  onSelect,
  onStartResize,
  onRemove,
  onExclude,
  onDelete,
  onPreview,
}: {
  cell: Cell
  photo: PhotoMeta
  selected: boolean
  onSelect: () => void
  onStartResize: (e: ReactPointerEvent<HTMLDivElement>) => void
  onRemove: () => void
  onExclude: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${cell.photoId}`,
    data: { type: "placed", photoId: cell.photoId, cell },
  })
  const src = getPortfolioImageSrc(photo)

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
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl pointer-events-none"
        draggable={false}
        aria-hidden="true"
      />
      <img
        src={src}
        alt={photo.filename}
        className="relative z-[1] h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />

      <div className="absolute inset-x-0 top-0 z-[3] flex items-center justify-end gap-1 p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-cream"
          title="Open full size"
        >
          <Expand className="h-3 w-3" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-red-400"
          title="Remove from layout"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onExclude()
          }}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-amber-300"
          title="Exclude from portfolio"
        >
          <Ban className="h-3 w-3" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded bg-black/60 p-1 text-cream/80 transition-colors hover:text-red-400"
          title="Delete photo"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div
        className="absolute bottom-0 right-0 z-[3] h-5 w-5 cursor-se-resize opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, transparent 50%, rgba(139,26,46,0.85) 50%)" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onStartResize(e)
        }}
      />
    </div>
  )
}

function LibraryCard({
  photo,
  placed,
  onCategoryChange,
  onPreview,
  onExcludeToggle,
  onDelete,
}: {
  photo: PhotoMeta
  placed: boolean
  onCategoryChange: (value: string) => void
  onPreview: () => void
  onExcludeToggle: () => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={getPortfolioImageSrc(photo)}
          alt={photo.filename}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2 text-[10px] uppercase tracking-[0.2em] text-cream/80">
          <span>{photo.excluded ? "Excluded" : placed ? "Placed" : "Unplaced"}</span>
          <button
            type="button"
            onClick={onPreview}
            className="rounded bg-black/50 p-1 transition-colors hover:text-cream"
            title="Open full size"
          >
            <Expand className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <p className="truncate text-xs text-cream/80">{photo.filename}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">{photo.id}</p>
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-gray-mid">Category</span>
          <select
            value={normalizePhotoCategory(photo.category)}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded border border-white/10 bg-dark px-2 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
          >
            {PHOTO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {PHOTO_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExcludeToggle}
            className="flex flex-1 items-center justify-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-2 text-[11px] uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10"
          >
            {photo.excluded ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
            {photo.excluded ? "Include" : "Exclude"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-950/50"
            title="Delete photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

function PreviewModal({
  photo,
  onClose,
}: {
  photo: PhotoMeta
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 text-cream transition-colors hover:text-wine"
        aria-label="Close preview"
      >
        <X className="h-8 w-8" />
      </button>
      <div className="max-h-[88vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={getPortfolioImageSrc(photo)}
          alt={photo.filename}
          className="max-h-[78vh] max-w-[92vw] object-contain"
        />
        <div className="mt-3 flex items-center justify-between text-sm text-cream/80">
          <span>{photo.filename}</span>
          <span className="uppercase tracking-[0.2em] text-gray-mid">
            {PHOTO_CATEGORY_LABELS[normalizePhotoCategory(photo.category)]}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function AdminPortfolioEditor({
  initialPhotos,
  initialLayout,
}: {
  initialPhotos: PhotoMeta[]
  initialLayout: LayoutData
}) {
  const [photos, setPhotos] = useState<PhotoMeta[]>(initialPhotos)
  const [savedPhotos, setSavedPhotos] = useState<PhotoMeta[]>(initialPhotos)
  const [layout, setLayout] = useState<LayoutData>(initialLayout)
  const [savedLayout, setSavedLayout] = useState<LayoutData>(initialLayout)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [colsInput, setColsInput] = useState(String(initialLayout.grid.cols))
  const [rowsInput, setRowsInput] = useState(String(initialLayout.grid.rows))
  const [arrangeStrategy, setArrangeStrategy] = useState<ArrangeStrategy>("neighbors")
  const [activeTab, setActiveTab] = useState<AdminTab>("layout")
  const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null)
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
    JSON.stringify(photos) !== JSON.stringify(savedPhotos) ||
    layout.grid.cols !== savedLayout.grid.cols ||
    layout.grid.rows !== savedLayout.grid.rows

  const photoMap = new Map(photos.map((photo) => [photo.id, photo]))
  const placedIds = new Set(layout.cells.map((cell) => cell.photoId))
  const unplaced = photos.filter((photo) => !photo.excluded && !placedIds.has(photo.id))
  const excluded = photos.filter((photo) => photo.excluded)
  const occupancy = buildOccupancyMap(layout.cells, layout.grid)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const previewPhoto = previewPhotoId ? photoMap.get(previewPhotoId) ?? null : null

  const ROW_H = 120

  const applyGridSize = useCallback(() => {
    const cols = Math.max(1, Math.min(40, parseInt(colsInput) || 12))
    const rows = Math.max(1, Math.min(40, parseInt(rowsInput) || 24))
    setColsInput(String(cols))
    setRowsInput(String(rows))
    setLayout((prev) => ({
      ...prev,
      grid: { cols, rows },
      cells: prev.cells
        .filter((cell) => cell.x < cols && cell.y < rows)
        .map((cell) => ({
          ...cell,
          spanX: Math.min(cell.spanX, cols - cell.x),
          spanY: Math.min(cell.spanY, rows - cell.y),
        })),
    }))
  }, [colsInput, rowsInput])

  const autoArrange = useCallback(() => {
    setLayout((prev) => ({
      ...prev,
      cells: arrangeByColor(photos, prev.grid, arrangeStrategy),
    }))
  }, [arrangeStrategy, photos])

  const excludePhoto = useCallback((photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, excluded: true } : photo))
    )
    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.filter((cell) => cell.photoId !== photoId),
    }))
  }, [])

  const includePhoto = useCallback((photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, excluded: false } : photo))
    )
  }, [])

  const updateCategory = useCallback((photoId: string, category: string) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, category } : photo))
    )
  }, [])

  const deletePhoto = useCallback(async (photoId: string) => {
    setDeletingPhotoId(photoId)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/admin/portfolio/photo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photoId }),
      })
      if (!res.ok) throw new Error(await res.text())

      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
      setSavedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
      setLayout((prev) => ({ ...prev, cells: prev.cells.filter((cell) => cell.photoId !== photoId) }))
      setSavedLayout((prev) => ({ ...prev, cells: prev.cells.filter((cell) => cell.photoId !== photoId) }))
      if (previewPhotoId === photoId) setPreviewPhotoId(null)
      setSaveMsg("Фото видалено")
    } catch (err) {
      setSaveMsg(`Помилка: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setDeletingPhotoId(null)
    }
  }, [previewPhotoId])

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
      const movingCell = cells.find((cell) => cell.photoId === photoId)
      const newCell: Cell = movingCell
        ? { ...movingCell, x: tx, y: ty }
        : { photoId, x: tx, y: ty, spanX: 1, spanY: 1 }

      if (!canFit(newCell, grid)) return prev

      const occ = buildOccupancyMap(cells, grid)
      const displaced = new Set<string>()
      for (let dy = 0; dy < newCell.spanY; dy++) {
        for (let dx = 0; dx < newCell.spanX; dx++) {
          const hit = occ.get(cellKey(tx + dx, ty + dy))
          if (hit && hit.photoId !== photoId) displaced.add(hit.photoId)
        }
      }

      let next = cells.filter((cell) => cell.photoId !== photoId && !displaced.has(cell.photoId))
      if (displaced.size === 1 && movingCell) {
        const [displacedId] = displaced
        const displacedCell = cells.find((cell) => cell.photoId === displacedId)
        if (displacedCell && canFit({ ...displacedCell, x: movingCell.x, y: movingCell.y }, grid)) {
          next.push({ ...displacedCell, x: movingCell.x, y: movingCell.y })
        }
      }

      next.push(newCell)
      return { ...prev, cells: next }
    })
  }, [])

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
  }, [layout.grid.cols, layout.grid.rows])

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
        const others = prev.cells.filter((item) => item.photoId !== cell.photoId)
        const occ = buildOccupancyMap(others, grid)
        const displaced = new Set<string>()

        for (let dy = 0; dy < updated.spanY; dy++) {
          for (let dx = 0; dx < updated.spanX; dx++) {
            const hit = occ.get(cellKey(updated.x + dx, updated.y + dy))
            if (hit) displaced.add(hit.photoId)
          }
        }

        return {
          ...prev,
          cells: [...others.filter((item) => !displaced.has(item.photoId)), updated],
        }
      })
    }

    function onUp() {
      resizingRef.current = null
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/admin/portfolio/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...layout, photos }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedLayout(layout)
      setSavedPhotos(photos)
      setSaveMsg("Збережено!")
    } catch (err) {
      setSaveMsg(`Помилка: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setSaving(false)
    }
  }, [layout, photos])

  const discard = useCallback(() => {
    setLayout(savedLayout)
    setPhotos(savedPhotos)
    setColsInput(String(savedLayout.grid.cols))
    setRowsInput(String(savedLayout.grid.rows))
  }, [savedLayout, savedPhotos])

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    const fd = new FormData()
    for (const file of files) fd.append("files", file)

    try {
      const res = await fetch("/api/admin/portfolio/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { added?: PhotoMeta[] }
      if (data.added?.length) {
        setPhotos((prev) => [...prev, ...data.added!])
        setSavedPhotos((prev) => [...prev, ...data.added!])
      }
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setUploading(false)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dark text-cream">
      <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-white/10 bg-dark/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("layout")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors ${
              activeTab === "layout" ? "bg-wine text-cream" : "text-gray-mid hover:text-cream"
            }`}
          >
            <Grid2x2 className="h-3.5 w-3.5" />
            Layout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors ${
              activeTab === "library" ? "bg-wine text-cream" : "text-gray-mid hover:text-cream"
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            Library
          </button>
        </div>

        {activeTab === "layout" && (
          <>
            <div className="flex items-center gap-1.5">
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
              <span className="text-gray-mid">x</span>
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
              className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-wine/20"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Auto-arrange
            </button>

            <select
              value={arrangeStrategy}
              onChange={(e) => setArrangeStrategy(e.target.value as ArrangeStrategy)}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              title="Arrangement strategy"
            >
              {ARRANGE_STRATEGIES.map((strategy) => (
                <option key={strategy} value={strategy} className="bg-dark text-cream">
                  {strategy === "neighbors"
                    ? "Smooth neighbors"
                    : strategy === "lightness"
                      ? "Lightness bands"
                      : "Radial blend"}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-wine/20 disabled:opacity-50"
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
            <span className={`text-xs ${saveMsg.startsWith("Помилка") ? "text-red-400" : "text-green-400"}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={discard}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </button>
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 rounded bg-wine px-3 py-1.5 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-wine/80 disabled:opacity-30"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {activeTab === "layout" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="relative flex-1 overflow-auto bg-dark" onClick={() => setSelected(null)}>
              <style>{`
                .admin-mosaic-grid {
                  display: grid;
                  grid-template-columns: repeat(${layout.grid.cols}, minmax(0, 1fr));
                  grid-template-rows: repeat(${layout.grid.rows}, ${ROW_H}px);
                }
              `}</style>
              <div ref={gridRef} className="admin-mosaic-grid">
                {Array.from({ length: layout.grid.rows }, (_, y) =>
                  Array.from({ length: layout.grid.cols }, (_, x) => (
                    <DropCell key={`${x},${y}`} x={x} y={y} occupied={occupancy.has(cellKey(x, y))} />
                  ))
                )}

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
                      onRemove={() =>
                        setLayout((prev) => ({
                          ...prev,
                          cells: prev.cells.filter((item) => item.photoId !== cell.photoId),
                        }))
                      }
                      onExclude={() => excludePhoto(cell.photoId)}
                      onDelete={() => void deletePhoto(cell.photoId)}
                      onPreview={() => setPreviewPhotoId(cell.photoId)}
                    />
                  )
                })}
              </div>
            </div>

            <div className="flex w-48 flex-shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-dark/90 p-3">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-mid">
                Unplaced ({unplaced.length})
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {unplaced.map((photo) => (
                  <PoolThumb
                    key={photo.id}
                    photo={photo}
                    id={photo.id}
                    excluded={false}
                    onExcludeToggle={() => excludePhoto(photo.id)}
                    onDelete={() => void deletePhoto(photo.id)}
                    onPreview={() => setPreviewPhotoId(photo.id)}
                  />
                ))}
              </div>

              <p className="mb-2 mt-4 text-[10px] uppercase tracking-widest text-gray-mid">
                Excluded ({excluded.length})
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {excluded.map((photo) => (
                  <PoolThumb
                    key={photo.id}
                    photo={photo}
                    id={photo.id}
                    excluded
                    onExcludeToggle={() => includePhoto(photo.id)}
                    onDelete={() => void deletePhoto(photo.id)}
                    onPreview={() => setPreviewPhotoId(photo.id)}
                  />
                ))}
              </div>

              {deletingPhotoId && (
                <p className="mt-3 text-[10px] uppercase tracking-widest text-gray-mid">
                  Deleting photo...
                </p>
              )}
            </div>
          </div>
          <DragOverlay />
        </DndContext>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-dark px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-wine">Photo Library</p>
              <h2 className="mt-1 text-xl text-cream">Categories and preview</h2>
            </div>
            <p className="text-sm text-gray-mid">{photos.length} photos</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {photos.map((photo) => (
              <LibraryCard
                key={photo.id}
                photo={photo}
                placed={placedIds.has(photo.id)}
                onCategoryChange={(value) => updateCategory(photo.id, value)}
                onPreview={() => setPreviewPhotoId(photo.id)}
                onExcludeToggle={() => (photo.excluded ? includePhoto(photo.id) : excludePhoto(photo.id))}
                onDelete={() => void deletePhoto(photo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {previewPhoto ? (
        <PreviewModal photo={previewPhoto} onClose={() => setPreviewPhotoId(null)} />
      ) : null}
    </div>
  )
}
