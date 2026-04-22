"use client"

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
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
  Lock,
  Loader2,
  Play,
  Search,
  RotateCcw,
  Save,
  Trash2,
  Unlock,
  Upload,
  Wand2,
  X,
} from "lucide-react"
import { upload } from "@vercel/blob/client"
import { createPortal } from "react-dom"
import { getPortfolioImageSrc, getPortfolioVideoSrc } from "@/lib/portfolio/image-src"
import type { HeroVideoConfig, PhotoMeta, VideoMeta, LayoutData, Cell, GridConfig } from "@/lib/portfolio/types"
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

const VIDEO_CATEGORIES = [
  "dance",
  "wedding",
  "kids",
  "brand",
  "custom",
  "lovestory",
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

const VIDEO_CATEGORY_LABELS: Record<(typeof VIDEO_CATEGORIES)[number], string> = {
  dance: "Dance",
  wedding: "Wedding",
  kids: "Kids",
  brand: "Brand",
  custom: "Custom",
  lovestory: "Love Story",
}

function normalizePhotoCategory(category?: string): (typeof PHOTO_CATEGORIES)[number] {
  if (category === "commercial" || category === "brand") return "brand"
  if (category === "dance" || category === "wedding" || category === "kids" || category === "custom" || category === "lovestory" || category === "portrait") {
    return category
  }
  return "custom"
}

type AdminTab = "layout" | "library" | "videos"
type LibraryStatusFilter = "all" | "placed" | "unplaced" | "excluded"
type LibrarySort = "newest" | "oldest" | "filename"

function normalizeVideoCategory(category?: string): (typeof VIDEO_CATEGORIES)[number] {
  if (category === "commercial" || category === "brand") return "brand"
  if (category === "dance" || category === "wedding" || category === "kids" || category === "custom" || category === "lovestory") {
    return category
  }
  return "custom"
}

function cellKey(x: number, y: number) {
  return `${x},${y}`
}

function sanitizeUploadName(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
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
  onToggleLock,
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
  onToggleLock: () => void
  onRemove: () => void
  onExclude: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${cell.photoId}`,
    data: { type: "placed", photoId: cell.photoId, cell },
    disabled: Boolean(cell.locked),
  })
  const src = getPortfolioImageSrc(photo)

  return (
    <div
      ref={setNodeRef}
      className={`group relative overflow-hidden ${cell.locked ? "cursor-default" : "cursor-grab"}`}
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
            onToggleLock()
          }}
          className={`rounded p-1 transition-colors ${cell.locked ? "bg-wine/80 text-cream" : "bg-black/60 text-cream/80 hover:text-amber-200"}`}
          title={cell.locked ? "Unlock position" : "Lock position"}
        >
          {cell.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>
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
        className={`absolute bottom-0 right-0 z-[3] h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 ${cell.locked ? "cursor-not-allowed" : "cursor-se-resize"}`}
        style={{ background: "linear-gradient(135deg, transparent 50%, rgba(139,26,46,0.85) 50%)" }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (cell.locked) return
          onStartResize(e)
        }}
      />

      {cell.locked ? (
        <div className="absolute bottom-2 left-2 z-[3] rounded-full bg-black/65 p-1 text-cream/90">
          <Lock className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  )
}

function LibraryCard({
  photo,
  placed,
  selected,
  onCategoryChange,
  onToggleSelected,
  onPreview,
  onExcludeToggle,
  onDelete,
}: {
  photo: PhotoMeta
  placed: boolean
  selected: boolean
  onCategoryChange: (value: string) => void
  onToggleSelected: () => void
  onPreview: () => void
  onExcludeToggle: () => void
  onDelete: () => void
}) {
  return (
    <article className={`rounded-2xl border p-3 transition-colors ${selected ? "border-wine bg-wine/10" : "border-white/10 bg-white/5"}`}>
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={getPortfolioImageSrc(photo)}
          alt={photo.filename}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2 text-[10px] uppercase tracking-[0.2em] text-cream/80">
          <label className="flex items-center gap-2 rounded bg-black/50 px-2 py-1 text-[10px] tracking-[0.18em]">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelected}
              className="h-3.5 w-3.5 accent-[#8b1a2e]"
            />
            Select
          </label>
          <div className="flex items-center gap-2">
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

function VideoLibraryCard({
  video,
  selected,
  onCategoryChange,
  onToggleSelected,
  onPreview,
  onExcludeToggle,
  onDelete,
}: {
  video: VideoMeta
  selected: boolean
  onCategoryChange: (value: string) => void
  onToggleSelected: () => void
  onPreview: () => void
  onExcludeToggle: () => void
  onDelete: () => void
}) {
  return (
    <article className={`rounded-2xl border p-3 transition-colors ${selected ? "border-wine bg-wine/10" : "border-white/10 bg-white/5"}`}>
      <div className="relative overflow-hidden rounded-xl">
        <video
          src={getPortfolioVideoSrc(video)}
          className="aspect-video w-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-2 text-[10px] uppercase tracking-[0.2em] text-cream/80">
          <label className="flex items-center gap-2 rounded bg-black/50 px-2 py-1 text-[10px] tracking-[0.18em]">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelected}
              className="h-3.5 w-3.5 accent-[#8b1a2e]"
            />
            Select
          </label>
          <div className="flex items-center gap-2">
            <span>{video.excluded ? "Excluded" : "Published"}</span>
            <button
              type="button"
              onClick={onPreview}
              className="rounded bg-black/50 p-1 transition-colors hover:text-cream"
              title="Open video"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <p className="truncate text-xs text-cream/80">{video.title || video.filename}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">{video.id}</p>
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-gray-mid">Category</span>
          <select
            value={normalizeVideoCategory(video.category)}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded border border-white/10 bg-dark px-2 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
          >
            {VIDEO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {VIDEO_CATEGORY_LABELS[category]}
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
            {video.excluded ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
            {video.excluded ? "Include" : "Exclude"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-950/50"
            title="Delete video"
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

function VideoPreviewModal({
  video,
  onClose,
}: {
  video: VideoMeta
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
        <video
          src={getPortfolioVideoSrc(video)}
          className="max-h-[78vh] max-w-[92vw]"
          controls
          autoPlay
          playsInline
        />
        <div className="mt-3 flex items-center justify-between text-sm text-cream/80">
          <span>{video.title || video.filename}</span>
          <span className="uppercase tracking-[0.2em] text-gray-mid">
            {VIDEO_CATEGORY_LABELS[normalizeVideoCategory(video.category)]}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function AdminPortfolioEditor({
  initialPhotos,
  initialVideos,
  initialHeroVideos,
  initialLayout,
}: {
  initialPhotos: PhotoMeta[]
  initialVideos: VideoMeta[]
  initialHeroVideos: HeroVideoConfig
  initialLayout: LayoutData
}) {
  const [photos, setPhotos] = useState<PhotoMeta[]>(initialPhotos)
  const [savedPhotos, setSavedPhotos] = useState<PhotoMeta[]>(initialPhotos)
  const [videos, setVideos] = useState<VideoMeta[]>(initialVideos)
  const [savedVideos, setSavedVideos] = useState<VideoMeta[]>(initialVideos)
  const [heroVideos, setHeroVideos] = useState<HeroVideoConfig>(initialHeroVideos)
  const [savedHeroVideos, setSavedHeroVideos] = useState<HeroVideoConfig>(initialHeroVideos)
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
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null)
  const [libraryQuery, setLibraryQuery] = useState("")
  const [libraryCategory, setLibraryCategory] = useState<"all" | (typeof PHOTO_CATEGORIES)[number]>("all")
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatusFilter>("all")
  const [librarySort, setLibrarySort] = useState<LibrarySort>("newest")
  const [libraryPage, setLibraryPage] = useState(1)
  const [libraryPageSize, setLibraryPageSize] = useState(48)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [videoQuery, setVideoQuery] = useState("")
  const [videoCategory, setVideoCategory] = useState<"all" | (typeof VIDEO_CATEGORIES)[number]>("all")
  const [videoStatus, setVideoStatus] = useState<"all" | "included" | "excluded">("all")
  const [videoSort, setVideoSort] = useState<LibrarySort>("newest")
  const [videoPage, setVideoPage] = useState(1)
  const [videoPageSize, setVideoPageSize] = useState(24)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [pendingHeroSlot, setPendingHeroSlot] = useState<keyof HeroVideoConfig | null>(null)
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
    JSON.stringify(videos) !== JSON.stringify(savedVideos) ||
    JSON.stringify(heroVideos) !== JSON.stringify(savedHeroVideos) ||
    layout.grid.cols !== savedLayout.grid.cols ||
    layout.grid.rows !== savedLayout.grid.rows

  const photoMap = new Map(photos.map((photo) => [photo.id, photo]))
  const videoMap = new Map(videos.map((video) => [video.id, video]))
  const photoOrder = new Map(photos.map((photo, index) => [photo.id, index]))
  const videoOrder = new Map(videos.map((video, index) => [video.id, index]))
  const placedIds = new Set(layout.cells.map((cell) => cell.photoId))
  const unplaced = photos.filter((photo) => !photo.excluded && !placedIds.has(photo.id))
  const excluded = photos.filter((photo) => photo.excluded)
  const occupancy = buildOccupancyMap(layout.cells, layout.grid)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const previewPhoto = previewPhotoId ? photoMap.get(previewPhotoId) ?? null : null
  const previewVideo = previewVideoId ? videoMap.get(previewVideoId) ?? null : null
  const desktopHeroVideo = heroVideos.desktopVideoId ? videoMap.get(heroVideos.desktopVideoId) ?? null : null
  const mobileHeroVideo = heroVideos.mobileVideoId ? videoMap.get(heroVideos.mobileVideoId) ?? null : null
  const normalizedLibraryQuery = libraryQuery.trim().toLowerCase()
  const normalizedVideoQuery = videoQuery.trim().toLowerCase()

  const filteredLibraryPhotos = useMemo(() => {
    const next = photos.filter((photo) => {
      const normalizedCategory = normalizePhotoCategory(photo.category)
      const matchesQuery =
        !normalizedLibraryQuery ||
        photo.filename.toLowerCase().includes(normalizedLibraryQuery) ||
        photo.id.toLowerCase().includes(normalizedLibraryQuery)
      const matchesCategory = libraryCategory === "all" || normalizedCategory === libraryCategory
      const matchesStatus =
        libraryStatus === "all" ||
        (libraryStatus === "placed" && placedIds.has(photo.id) && !photo.excluded) ||
        (libraryStatus === "unplaced" && !placedIds.has(photo.id) && !photo.excluded) ||
        (libraryStatus === "excluded" && !!photo.excluded)

      return matchesQuery && matchesCategory && matchesStatus
    })

    next.sort((a, b) => {
      if (librarySort === "filename") return a.filename.localeCompare(b.filename)
      const aIndex = photoOrder.get(a.id) ?? 0
      const bIndex = photoOrder.get(b.id) ?? 0
      return librarySort === "oldest" ? aIndex - bIndex : bIndex - aIndex
    })

    return next
  }, [libraryCategory, librarySort, libraryStatus, normalizedLibraryQuery, photoOrder, photos, placedIds])

  const totalLibraryPages = Math.max(1, Math.ceil(filteredLibraryPhotos.length / libraryPageSize))
  const paginatedLibraryPhotos = useMemo(() => {
    const start = (libraryPage - 1) * libraryPageSize
    return filteredLibraryPhotos.slice(start, start + libraryPageSize)
  }, [filteredLibraryPhotos, libraryPage, libraryPageSize])
  const selectedVisibleCount = paginatedLibraryPhotos.filter((photo) => selectedPhotoIds.includes(photo.id)).length
  const allVisibleSelected = paginatedLibraryPhotos.length > 0 && selectedVisibleCount === paginatedLibraryPhotos.length
  const allFilteredSelected = filteredLibraryPhotos.length > 0 && filteredLibraryPhotos.every((photo) => selectedPhotoIds.includes(photo.id))

  const filteredVideos = useMemo(() => {
    const next = videos.filter((video) => {
      const normalizedCategory = normalizeVideoCategory(video.category)
      const matchesQuery =
        !normalizedVideoQuery ||
        video.filename.toLowerCase().includes(normalizedVideoQuery) ||
        (video.title || "").toLowerCase().includes(normalizedVideoQuery) ||
        video.id.toLowerCase().includes(normalizedVideoQuery)
      const matchesCategory = videoCategory === "all" || normalizedCategory === videoCategory
      const matchesStatus =
        videoStatus === "all" ||
        (videoStatus === "included" && !video.excluded) ||
        (videoStatus === "excluded" && !!video.excluded)

      return matchesQuery && matchesCategory && matchesStatus
    })

    next.sort((a, b) => {
      if (videoSort === "filename") return (a.title || a.filename).localeCompare(b.title || b.filename)
      const aIndex = videoOrder.get(a.id) ?? 0
      const bIndex = videoOrder.get(b.id) ?? 0
      return videoSort === "oldest" ? aIndex - bIndex : bIndex - aIndex
    })

    return next
  }, [normalizedVideoQuery, videoCategory, videoOrder, videoSort, videoStatus, videos])

  const totalVideoPages = Math.max(1, Math.ceil(filteredVideos.length / videoPageSize))
  const paginatedVideos = useMemo(() => {
    const start = (videoPage - 1) * videoPageSize
    return filteredVideos.slice(start, start + videoPageSize)
  }, [filteredVideos, videoPage, videoPageSize])
  const selectedVisibleVideoCount = paginatedVideos.filter((video) => selectedVideoIds.includes(video.id)).length
  const allVisibleVideosSelected = paginatedVideos.length > 0 && selectedVisibleVideoCount === paginatedVideos.length
  const allFilteredVideosSelected = filteredVideos.length > 0 && filteredVideos.every((video) => selectedVideoIds.includes(video.id))

  const ROW_H = 120

  useEffect(() => {
    const validIds = new Set(photos.map((photo) => photo.id))
    setSelectedPhotoIds((prev) => {
      const next = prev.filter((id) => validIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [photos])

  useEffect(() => {
    const validIds = new Set(videos.map((video) => video.id))
    setSelectedVideoIds((prev) => {
      const next = prev.filter((id) => validIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [videos])

  useEffect(() => {
    const validIds = new Set(videos.map((video) => video.id))
    setHeroVideos((prev) => {
      const next: HeroVideoConfig = {
        desktopVideoId: prev.desktopVideoId && validIds.has(prev.desktopVideoId) ? prev.desktopVideoId : null,
        mobileVideoId: prev.mobileVideoId && validIds.has(prev.mobileVideoId) ? prev.mobileVideoId : null,
      }
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
  }, [videos])

  useEffect(() => {
    setLibraryPage(1)
  }, [libraryCategory, libraryPageSize, libraryQuery, librarySort, libraryStatus])

  useEffect(() => {
    setVideoPage(1)
  }, [videoCategory, videoPageSize, videoQuery, videoSort, videoStatus])

  useEffect(() => {
    if (libraryPage > totalLibraryPages) setLibraryPage(totalLibraryPages)
  }, [libraryPage, totalLibraryPages])

  useEffect(() => {
    if (videoPage > totalVideoPages) setVideoPage(totalVideoPages)
  }, [videoPage, totalVideoPages])

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
      cells: arrangeByColor(photos, prev.grid, arrangeStrategy, prev.cells),
    }))
  }, [arrangeStrategy, photos])

  const toggleCellLock = useCallback((photoId: string) => {
    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.photoId === photoId ? { ...cell, locked: !cell.locked } : cell
      ),
    }))
  }, [])

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

  const excludeVideo = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === videoId ? { ...video, excluded: true } : video))
    )
  }, [])

  const includeVideo = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === videoId ? { ...video, excluded: false } : video))
    )
  }, [])

  const updateCategory = useCallback((photoId: string, category: string) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, category: normalizePhotoCategory(category) } : photo))
    )
  }, [])

  const updateVideoCategory = useCallback((videoId: string, category: string) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === videoId ? { ...video, category: normalizeVideoCategory(category) } : video))
    )
  }, [])

  const assignHeroVideo = useCallback((slot: keyof HeroVideoConfig, videoId: string | null) => {
    setHeroVideos((prev) => ({ ...prev, [slot]: videoId }))
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

  const deleteVideo = useCallback(async (videoId: string) => {
    setDeletingPhotoId(videoId)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/admin/portfolio/video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId }),
      })
      if (!res.ok) throw new Error(await res.text())

      setVideos((prev) => prev.filter((video) => video.id !== videoId))
      setSavedVideos((prev) => prev.filter((video) => video.id !== videoId))
      setHeroVideos((prev) => ({
        desktopVideoId: prev.desktopVideoId === videoId ? null : prev.desktopVideoId,
        mobileVideoId: prev.mobileVideoId === videoId ? null : prev.mobileVideoId,
      }))
      setSavedHeroVideos((prev) => ({
        desktopVideoId: prev.desktopVideoId === videoId ? null : prev.desktopVideoId,
        mobileVideoId: prev.mobileVideoId === videoId ? null : prev.mobileVideoId,
      }))
      if (previewVideoId === videoId) setPreviewVideoId(null)
      setSaveMsg("Video deleted")
    } catch (err) {
      setSaveMsg(`Delete error: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setDeletingPhotoId(null)
    }
  }, [previewVideoId])

  const bulkSetCategory = useCallback((ids: string[], category: string) => {
    const idSet = new Set(ids)
    const nextCategory = normalizePhotoCategory(category)
    setPhotos((prev) =>
      prev.map((photo) => (idSet.has(photo.id) ? { ...photo, category: nextCategory } : photo))
    )
  }, [])

  const bulkSetVideoCategory = useCallback((ids: string[], category: string) => {
    const idSet = new Set(ids)
    const nextCategory = normalizeVideoCategory(category)
    setVideos((prev) =>
      prev.map((video) => (idSet.has(video.id) ? { ...video, category: nextCategory } : video))
    )
  }, [])

  const bulkExclude = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setPhotos((prev) =>
      prev.map((photo) => (idSet.has(photo.id) ? { ...photo, excluded: true } : photo))
    )
    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.filter((cell) => !idSet.has(cell.photoId)),
    }))
  }, [])

  const bulkInclude = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setPhotos((prev) =>
      prev.map((photo) => (idSet.has(photo.id) ? { ...photo, excluded: false } : photo))
    )
  }, [])

  const bulkExcludeVideos = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setVideos((prev) =>
      prev.map((video) => (idSet.has(video.id) ? { ...video, excluded: true } : video))
    )
  }, [])

  const bulkIncludeVideos = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setVideos((prev) =>
      prev.map((video) => (idSet.has(video.id) ? { ...video, excluded: false } : video))
    )
  }, [])

  const bulkDelete = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    setDeletingPhotoId("bulk")
    setSaveMsg(null)
    try {
      await Promise.all(
        ids.map(async (photoId) => {
          const res = await fetch("/api/admin/portfolio/photo", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: photoId }),
          })
          if (!res.ok) throw new Error(await res.text())
        })
      )

      const idSet = new Set(ids)
      setPhotos((prev) => prev.filter((photo) => !idSet.has(photo.id)))
      setSavedPhotos((prev) => prev.filter((photo) => !idSet.has(photo.id)))
      setLayout((prev) => ({ ...prev, cells: prev.cells.filter((cell) => !idSet.has(cell.photoId)) }))
      setSavedLayout((prev) => ({ ...prev, cells: prev.cells.filter((cell) => !idSet.has(cell.photoId)) }))
      setSelectedPhotoIds((prev) => prev.filter((id) => !idSet.has(id)))
      if (previewPhotoId && idSet.has(previewPhotoId)) setPreviewPhotoId(null)
      setSaveMsg(`${ids.length} photo${ids.length === 1 ? "" : "s"} deleted`)
    } catch (err) {
      setSaveMsg(`Delete error: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setDeletingPhotoId(null)
    }
  }, [previewPhotoId])

  const bulkDeleteVideos = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    setDeletingPhotoId("bulk-videos")
    setSaveMsg(null)
    try {
      await Promise.all(
        ids.map(async (videoId) => {
          const res = await fetch("/api/admin/portfolio/video", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: videoId }),
          })
          if (!res.ok) throw new Error(await res.text())
        })
      )

      const idSet = new Set(ids)
      setVideos((prev) => prev.filter((video) => !idSet.has(video.id)))
      setSavedVideos((prev) => prev.filter((video) => !idSet.has(video.id)))
      setHeroVideos((prev) => ({
        desktopVideoId: prev.desktopVideoId && idSet.has(prev.desktopVideoId) ? null : prev.desktopVideoId,
        mobileVideoId: prev.mobileVideoId && idSet.has(prev.mobileVideoId) ? null : prev.mobileVideoId,
      }))
      setSavedHeroVideos((prev) => ({
        desktopVideoId: prev.desktopVideoId && idSet.has(prev.desktopVideoId) ? null : prev.desktopVideoId,
        mobileVideoId: prev.mobileVideoId && idSet.has(prev.mobileVideoId) ? null : prev.mobileVideoId,
      }))
      setSelectedVideoIds((prev) => prev.filter((id) => !idSet.has(id)))
      if (previewVideoId && idSet.has(previewVideoId)) setPreviewVideoId(null)
      setSaveMsg(`${ids.length} video${ids.length === 1 ? "" : "s"} deleted`)
    } catch (err) {
      setSaveMsg(`Delete error: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setDeletingPhotoId(null)
    }
  }, [previewVideoId])

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) => toggleId(prev, photoId))
  }, [])

  const selectVisible = useCallback(() => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      for (const photo of paginatedLibraryPhotos) next.add(photo.id)
      return Array.from(next)
    })
  }, [paginatedLibraryPhotos])

  const selectFiltered = useCallback(() => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      for (const photo of filteredLibraryPhotos) next.add(photo.id)
      return Array.from(next)
    })
  }, [filteredLibraryPhotos])

  const clearSelection = useCallback(() => {
    setSelectedPhotoIds([])
  }, [])

  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideoIds((prev) => toggleId(prev, videoId))
  }, [])

  const selectVisibleVideos = useCallback(() => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev)
      for (const video of paginatedVideos) next.add(video.id)
      return Array.from(next)
    })
  }, [paginatedVideos])

  const selectFilteredVideos = useCallback(() => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev)
      for (const video of filteredVideos) next.add(video.id)
      return Array.from(next)
    })
  }, [filteredVideos])

  const clearVideoSelection = useCallback(() => {
    setSelectedVideoIds([])
  }, [])

  const toggleSelectVisible = useCallback(() => {
    if (allVisibleSelected) {
      const visibleIds = new Set(paginatedLibraryPhotos.map((photo) => photo.id))
      setSelectedPhotoIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }
    selectVisible()
  }, [allVisibleSelected, paginatedLibraryPhotos, selectVisible])

  const toggleSelectVisibleVideos = useCallback(() => {
    if (allVisibleVideosSelected) {
      const visibleIds = new Set(paginatedVideos.map((video) => video.id))
      setSelectedVideoIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }
    selectVisibleVideos()
  }, [allVisibleVideosSelected, paginatedVideos, selectVisibleVideos])

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
        body: JSON.stringify({ ...layout, photos, videos, heroVideos }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedLayout(layout)
      setSavedPhotos(photos)
      setSavedVideos(videos)
      setSavedHeroVideos(heroVideos)
      setSaveMsg("Збережено!")
    } catch (err) {
      setSaveMsg(`Помилка: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setSaving(false)
    }
  }, [heroVideos, layout, photos, videos])

  const discard = useCallback(() => {
    setLayout(savedLayout)
    setPhotos(savedPhotos)
    setVideos(savedVideos)
    setHeroVideos(savedHeroVideos)
    setColsInput(String(savedLayout.grid.cols))
    setRowsInput(String(savedLayout.grid.rows))
  }, [savedHeroVideos, savedLayout, savedPhotos, savedVideos])

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)

    try {
      if (activeTab === "videos") {
        const uploadedVideos: VideoMeta[] = []

        for (const file of Array.from(files)) {
          const safeName = sanitizeUploadName(file.name) || `video-${Date.now()}.mp4`
          const pathname = `portfolio/videos/${Date.now()}-${safeName}`
          const blob = await upload(pathname, file, {
            access: "public",
            contentType: file.type || undefined,
            handleUploadUrl: "/api/admin/portfolio/upload-video-client",
            multipart: true,
          })

          const registerRes = await fetch("/api/admin/portfolio/upload-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: blob.url,
              pathname: blob.pathname,
              contentType: blob.contentType,
              title: file.name.replace(/\.[^.]+$/, ""),
            }),
          })
          if (!registerRes.ok) throw new Error(await registerRes.text())

          const data = await registerRes.json() as { added?: VideoMeta[] }
          if (data.added?.length) {
            uploadedVideos.push(...data.added)
          }
        }

        if (uploadedVideos.length) {
          setVideos((prev) => {
            const next = [...prev]
            for (const video of uploadedVideos) {
              const index = next.findIndex((item) => item.id === video.id)
              if (index === -1) next.push(video)
              else next[index] = video
            }
            return next
          })
          setSavedVideos((prev) => {
            const next = [...prev]
            for (const video of uploadedVideos) {
              const index = next.findIndex((item) => item.id === video.id)
              if (index === -1) next.push(video)
              else next[index] = video
            }
            return next
          })
        }
      } else {
        const fd = new FormData()
        for (const file of files) fd.append("files", file)
        const res = await fetch("/api/admin/portfolio/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json() as { added?: PhotoMeta[] }
        if (data.added?.length) {
          const addedPhotos = data.added
          setPhotos((prev) => [...prev, ...addedPhotos])
          setSavedPhotos((prev) => [...prev, ...addedPhotos])
        }
      }
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setUploading(false)
    }
  }, [activeTab])

  const handleHeroUpload = useCallback(async (slot: keyof HeroVideoConfig, files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)

    try {
      const file = files[0]
      const safeName = sanitizeUploadName(file.name) || `hero-${Date.now()}.mp4`
      const pathname = `portfolio/videos/hero-${slot}-${Date.now()}-${safeName}`
      const blob = await upload(pathname, file, {
        access: "public",
        contentType: file.type || undefined,
        handleUploadUrl: "/api/admin/portfolio/upload-video-client",
        multipart: true,
      })

      const res = await fetch("/api/admin/portfolio/upload-hero-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          title: file.name.replace(/\.[^.]+$/, ""),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { video?: VideoMeta }
      const uploadedVideo = data.video
      if (uploadedVideo) {
        setVideos((prev) => (prev.some((item) => item.id === uploadedVideo.id) ? prev : [...prev, uploadedVideo]))
        setSavedVideos((prev) => (prev.some((item) => item.id === uploadedVideo.id) ? prev : [...prev, uploadedVideo]))
        setHeroVideos((prev) => ({ ...prev, [slot]: uploadedVideo.id }))
      }
    } catch (err) {
      alert(`Hero video upload failed: ${err instanceof Error ? err.message : "unknown"}`)
    } finally {
      setUploading(false)
      setPendingHeroSlot(null)
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = ""
      }
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
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors ${
              activeTab === "videos" ? "bg-wine text-cream" : "text-gray-mid hover:text-cream"
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            Videos
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
          accept={activeTab === "videos" ? "video/*" : "image/*"}
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <input
          ref={heroFileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            if (pendingHeroSlot) {
              void handleHeroUpload(pendingHeroSlot, e.target.files)
            }
          }}
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
                      onToggleLock={() => toggleCellLock(cell.photoId)}
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
      ) : activeTab === "library" ? (
        <div className="min-h-0 flex-1 overflow-auto bg-dark px-4 py-4">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-wine">Photo Library</p>
                <h2 className="mt-1 text-xl text-cream">Categories and preview</h2>
              </div>
              <p className="text-sm text-gray-mid">
                {filteredLibraryPhotos.length} filtered / {photos.length} total
              </p>
            </div>

            <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-dark/95 p-3 backdrop-blur">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
                  <input
                    type="text"
                    value={libraryQuery}
                    onChange={(e) => setLibraryQuery(e.target.value)}
                    placeholder="Search by filename or id"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-wine"
                  />
                </label>

                <select
                  value={libraryCategory}
                  onChange={(e) => setLibraryCategory(e.target.value as "all" | (typeof PHOTO_CATEGORIES)[number])}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="all">All categories</option>
                  {PHOTO_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {PHOTO_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>

                <select
                  value={libraryStatus}
                  onChange={(e) => setLibraryStatus(e.target.value as LibraryStatusFilter)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="all">All statuses</option>
                  <option value="placed">Placed</option>
                  <option value="unplaced">Unplaced</option>
                  <option value="excluded">Excluded</option>
                </select>

                <select
                  value={librarySort}
                  onChange={(e) => setLibrarySort(e.target.value as LibrarySort)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="filename">Filename</option>
                </select>

                <select
                  value={String(libraryPageSize)}
                  onChange={(e) => setLibraryPageSize(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="48">48 / page</option>
                  <option value="96">96 / page</option>
                  <option value="144">144 / page</option>
                </select>
              </div>

              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-mid">
                  <span>{selectedPhotoIds.length} selected</span>
                  <button
                    type="button"
                    onClick={toggleSelectVisible}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10"
                  >
                    {allVisibleSelected ? "Unselect visible" : "Select visible"}
                  </button>
                  <button
                    type="button"
                    onClick={selectFiltered}
                    disabled={allFilteredSelected || filteredLibraryPhotos.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Select filtered
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={selectedPhotoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value || selectedPhotoIds.length === 0) return
                      bulkSetCategory(selectedPhotoIds, e.target.value)
                      e.target.value = ""
                    }}
                    disabled={selectedPhotoIds.length === 0}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine disabled:opacity-40"
                  >
                    <option value="">Set category</option>
                    {PHOTO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {PHOTO_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => bulkExclude(selectedPhotoIds)}
                    disabled={selectedPhotoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Exclude
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkInclude(selectedPhotoIds)}
                    disabled={selectedPhotoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Include
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPhotoIds.length === 0) return
                      if (!window.confirm(`Delete ${selectedPhotoIds.length} selected photo(s)?`)) return
                      void bulkDelete(selectedPhotoIds)
                    }}
                    disabled={selectedPhotoIds.length === 0}
                    className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs uppercase tracking-[0.16em] text-red-300 transition-colors hover:bg-red-950/50 disabled:opacity-40"
                  >
                    Delete selected
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-mid">
              <span>
                Page {libraryPage} / {totalLibraryPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLibraryPage((prev) => Math.max(1, prev - 1))}
                  disabled={libraryPage === 1}
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryPage((prev) => Math.min(totalLibraryPages, prev + 1))}
                  disabled={libraryPage === totalLibraryPages}
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {paginatedLibraryPhotos.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginatedLibraryPhotos.map((photo) => (
                <LibraryCard
                  key={photo.id}
                  photo={photo}
                  placed={placedIds.has(photo.id)}
                  selected={selectedPhotoIds.includes(photo.id)}
                  onCategoryChange={(value) => updateCategory(photo.id, value)}
                  onToggleSelected={() => togglePhotoSelection(photo.id)}
                  onPreview={() => setPreviewPhotoId(photo.id)}
                  onExcludeToggle={() => (photo.excluded ? includePhoto(photo.id) : excludePhoto(photo.id))}
                  onDelete={() => void deletePhoto(photo.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-gray-mid">
              No photos match the current filters.
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-dark px-4 py-4">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-wine">Video Library</p>
                <h2 className="mt-1 text-xl text-cream">Videos and preview</h2>
              </div>
              <p className="text-sm text-gray-mid">
                {filteredVideos.length} filtered / {videos.length} total
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {([
                {
                  slot: "desktopVideoId",
                  title: "Desktop hero",
                  description: "Background video for desktop home hero",
                  current: desktopHeroVideo,
                },
                {
                  slot: "mobileVideoId",
                  title: "Mobile hero",
                  description: "Background video for mobile home hero",
                  current: mobileHeroVideo,
                },
              ] as const).map((heroSlot) => (
                <article key={heroSlot.slot} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-wine">Hero video</p>
                      <h3 className="mt-1 text-lg text-cream">{heroSlot.title}</h3>
                      <p className="mt-1 text-sm text-gray-mid">{heroSlot.description}</p>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-mid">
                      {heroSlot.current ? "Assigned" : "Poster fallback"}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {heroSlot.current ? (
                      <video
                        src={getPortfolioVideoSrc(heroSlot.current)}
                        className="aspect-video w-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center text-sm uppercase tracking-[0.22em] text-gray-mid">
                        No video selected
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={heroVideos[heroSlot.slot] ?? ""}
                        onChange={(e) => assignHeroVideo(heroSlot.slot, e.target.value || null)}
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                      >
                        <option value="">No video</option>
                        {videos.map((video) => (
                          <option key={video.id} value={video.id}>
                            {video.title || video.filename}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingHeroSlot(heroSlot.slot)
                          heroFileInputRef.current?.click()
                        }}
                        disabled={uploading}
                        className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                      >
                        {uploading && pendingHeroSlot === heroSlot.slot ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => heroSlot.current && setPreviewVideoId(heroSlot.current.id)}
                        disabled={!heroSlot.current}
                        className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => assignHeroVideo(heroSlot.slot, null)}
                        disabled={!heroVideos[heroSlot.slot]}
                        className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                      >
                        Clear
                      </button>
                      <span className="text-xs text-gray-mid">
                        {heroSlot.current ? heroSlot.current.title || heroSlot.current.filename : "Falls back to poster image on the home page"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-dark/95 p-3 backdrop-blur">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
                  <input
                    type="text"
                    value={videoQuery}
                    onChange={(e) => setVideoQuery(e.target.value)}
                    placeholder="Search by title, filename or id"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-wine"
                  />
                </label>

                <select
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value as "all" | (typeof VIDEO_CATEGORIES)[number])}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="all">All categories</option>
                  {VIDEO_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {VIDEO_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>

                <select
                  value={videoStatus}
                  onChange={(e) => setVideoStatus(e.target.value as "all" | "included" | "excluded")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="all">All statuses</option>
                  <option value="included">Included</option>
                  <option value="excluded">Excluded</option>
                </select>

                <select
                  value={videoSort}
                  onChange={(e) => setVideoSort(e.target.value as LibrarySort)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="filename">Filename</option>
                </select>

                <select
                  value={String(videoPageSize)}
                  onChange={(e) => setVideoPageSize(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                >
                  <option value="24">24 / page</option>
                  <option value="48">48 / page</option>
                  <option value="96">96 / page</option>
                </select>
              </div>

              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-mid">
                  <span>{selectedVideoIds.length} selected</span>
                  <button
                    type="button"
                    onClick={toggleSelectVisibleVideos}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10"
                  >
                    {allVisibleVideosSelected ? "Unselect visible" : "Select visible"}
                  </button>
                  <button
                    type="button"
                    onClick={selectFilteredVideos}
                    disabled={allFilteredVideosSelected || filteredVideos.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Select filtered
                  </button>
                  <button
                    type="button"
                    onClick={clearVideoSelection}
                    disabled={selectedVideoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value || selectedVideoIds.length === 0) return
                      bulkSetVideoCategory(selectedVideoIds, e.target.value)
                      e.target.value = ""
                    }}
                    disabled={selectedVideoIds.length === 0}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine disabled:opacity-40"
                  >
                    <option value="">Set category</option>
                    {VIDEO_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {VIDEO_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => bulkExcludeVideos(selectedVideoIds)}
                    disabled={selectedVideoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Exclude
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkIncludeVideos(selectedVideoIds)}
                    disabled={selectedVideoIds.length === 0}
                    className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    Include
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVideoIds.length === 0) return
                      if (!window.confirm(`Delete ${selectedVideoIds.length} selected video(s)?`)) return
                      void bulkDeleteVideos(selectedVideoIds)
                    }}
                    disabled={selectedVideoIds.length === 0}
                    className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs uppercase tracking-[0.16em] text-red-300 transition-colors hover:bg-red-950/50 disabled:opacity-40"
                  >
                    Delete selected
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-mid">
              <span>
                Page {videoPage} / {totalVideoPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoPage((prev) => Math.max(1, prev - 1))}
                  disabled={videoPage === 1}
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setVideoPage((prev) => Math.min(totalVideoPages, prev + 1))}
                  disabled={videoPage === totalVideoPages}
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cream transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {paginatedVideos.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginatedVideos.map((video) => (
                <VideoLibraryCard
                  key={video.id}
                  video={video}
                  selected={selectedVideoIds.includes(video.id)}
                  onCategoryChange={(value) => updateVideoCategory(video.id, value)}
                  onToggleSelected={() => toggleVideoSelection(video.id)}
                  onPreview={() => setPreviewVideoId(video.id)}
                  onExcludeToggle={() => (video.excluded ? includeVideo(video.id) : excludeVideo(video.id))}
                  onDelete={() => void deleteVideo(video.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-gray-mid">
              No videos match the current filters.
            </div>
          )}
        </div>
      )}

      {previewPhoto ? (
        <PreviewModal photo={previewPhoto} onClose={() => setPreviewPhotoId(null)} />
      ) : null}
      {previewVideo ? (
        <VideoPreviewModal video={previewVideo} onClose={() => setPreviewVideoId(null)} />
      ) : null}
    </div>
  )
}
