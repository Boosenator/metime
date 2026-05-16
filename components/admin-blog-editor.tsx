"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Globe, Eye, EyeOff, ArrowLeft, Images, Video, Check, X } from "lucide-react"
import type { BlogLocale, BlogPost, BlogPostTranslation, TopicBlock } from "@/lib/blog/types"
import type { CarouselPhoto } from "@/lib/services/types"

const CATEGORIES = [
  { value: "wedding", label: "Весілля" },
  { value: "dance", label: "Танець" },
  { value: "kids", label: "Діти" },
  { value: "brand", label: "Бренд" },
  { value: "lovestory", label: "Love Story" },
  { value: "portrait", label: "Портрет" },
  { value: "custom", label: "Інше" },
]

const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",
  і:"i",ї:"yi",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",
  т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya",
}

const CATEGORY_LABELS_UK: Record<string, string> = {
  dance: "танцювальна зйомка",
  wedding: "весільна зйомка",
  kids: "дитяча зйомка",
  brand: "бренд-зйомка",
  commercial: "бренд-зйомка",
  lovestory: "love story",
  portrait: "портретна зйомка",
  custom: "фотозйомка",
}

function toSlug(str: string) {
  return str.toLowerCase()
    .split("").map((c) => TRANSLIT[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

// ─── Photo picker ─────────────────────────────────────────────────────────────

type PortfolioPhoto = {
  id: string
  filename: string
  src?: string
  category?: string
}

type PortfolioVideo = {
  id: string
  filename: string
  src?: string
  category?: string
  title?: string
}

function photoSrc(p: PortfolioPhoto) {
  return p.src || `/images/portfolio/${p.filename}`
}

function videoSrc(v: PortfolioVideo) {
  return v.src || `/videos/portfolio/${v.filename}`
}

function PhotoPickerPanel({
  password,
  currentSrcs,
  onApply,
  onClose,
}: {
  password: string
  currentSrcs: string[]
  onApply: (photos: CarouselPhoto[]) => void
  onClose: () => void
}) {
  const [photos, setPhotos] = useState<PortfolioPhoto[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [picks, setPicks] = useState<Set<string>>(new Set(currentSrcs))
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetch("/api/admin/portfolio/state", { headers: { "x-admin-password": password } })
      .then((r) => r.json())
      .then((d) => setPhotos((d.photos as PortfolioPhoto[]) ?? []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [password])

  const toggle = (src: string) => {
    setPicks((prev) => {
      const next = new Set(prev)
      next.has(src) ? next.delete(src) : next.add(src)
      return next
    })
  }

  const apply = () => {
    const ordered = (photos ?? [])
      .filter((p) => picks.has(photoSrc(p)))
      .map((p) => ({
        src: photoSrc(p),
        alt: `MeTime Studio — ${CATEGORY_LABELS_UK[p.category ?? ""] ?? "зйомка"}`,
      }))
    onApply(ordered)
    onClose()
  }

  const cats = ["all", ...Array.from(new Set((photos ?? []).map((p) => p.category).filter(Boolean)))]
  const visible = filter === "all" ? photos ?? [] : (photos ?? []).filter((p) => p.category === filter)

  return (
    <div className="mt-3 rounded border border-wine/30 bg-dark p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-wine">
          <Images className="mr-1.5 inline h-3 w-3" />
          Бібліотека фото ({picks.size} обрано)
        </span>
        <button onClick={onClose} className="text-gray-mid hover:text-cream">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Category filter */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c ?? "all")}
            className={`px-2 py-0.5 text-xs uppercase tracking-[0.1em] border transition-colors ${
              filter === c
                ? "border-wine text-wine"
                : "border-white/15 text-gray-mid hover:border-white/40"
            }`}
          >
            {c === "all" ? "Всі" : CATEGORY_LABELS_UK[c ?? ""] ?? c}
          </button>
        ))}
      </div>

      {loading && <p className="py-4 text-center text-xs text-gray-mid">Завантаження...</p>}

      {!loading && (
        <div className="grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto sm:grid-cols-7 md:grid-cols-9">
          {visible.map((photo) => {
            const src = photoSrc(photo)
            const selected = picks.has(src)
            return (
              <button
                key={photo.id}
                onClick={() => toggle(src)}
                className={`relative aspect-square overflow-hidden border-2 transition-colors ${
                  selected ? "border-wine" : "border-transparent"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                {selected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-wine/40">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="border border-white/15 px-3 py-1.5 text-xs text-gray-mid hover:text-cream"
        >
          Скасувати
        </button>
        <button
          onClick={apply}
          className="bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream hover:opacity-90"
        >
          Застосувати ({picks.size})
        </button>
      </div>
    </div>
  )
}

function VideoPickerPanel({
  password,
  currentSrc,
  onApply,
  onClose,
}: {
  password: string
  currentSrc: string
  onApply: (src: string, title?: string) => void
  onClose: () => void
}) {
  const [videos, setVideos] = useState<PortfolioVideo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState(currentSrc)

  useEffect(() => {
    fetch("/api/admin/portfolio/state", { headers: { "x-admin-password": password } })
      .then((r) => r.json())
      .then((d) => setVideos((d.videos as PortfolioVideo[]) ?? []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [password])

  const apply = () => {
    const v = (videos ?? []).find((v) => videoSrc(v) === picked)
    onApply(picked, v?.title)
    onClose()
  }

  return (
    <div className="mt-3 rounded border border-wine/30 bg-dark p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-wine">
          <Video className="mr-1.5 inline h-3 w-3" />
          Бібліотека відео
        </span>
        <button onClick={onClose} className="text-gray-mid hover:text-cream">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && <p className="py-4 text-center text-xs text-gray-mid">Завантаження...</p>}

      {!loading && (
        <div className="max-h-60 space-y-1.5 overflow-y-auto">
          {(videos ?? []).length === 0 && (
            <p className="text-xs text-gray-mid">Відео не знайдено в бібліотеці</p>
          )}
          {(videos ?? []).map((v) => {
            const src = videoSrc(v)
            const isSelected = picked === src
            return (
              <button
                key={v.id}
                onClick={() => setPicked(src)}
                className={`flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors ${
                  isSelected ? "border-wine bg-wine/10" : "border-white/8 hover:border-white/20"
                }`}
              >
                <Video className={`h-4 w-4 shrink-0 ${isSelected ? "text-wine" : "text-gray-mid"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-cream">{v.title || v.filename}</p>
                  {v.category && (
                    <p className="text-xs text-gray-mid">
                      {CATEGORY_LABELS_UK[v.category] ?? v.category}
                    </p>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-wine" />}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="border border-white/15 px-3 py-1.5 text-xs text-gray-mid hover:text-cream"
        >
          Скасувати
        </button>
        <button
          onClick={apply}
          disabled={!picked}
          className="bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream hover:opacity-90 disabled:opacity-40"
        >
          Застосувати
        </button>
      </div>
    </div>
  )
}

// ─── Block row ────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  index,
  total,
  password,
  onChange,
  onMove,
  onDelete,
}: {
  block: TopicBlock
  index: number
  total: number
  password: string
  onChange: (b: TopicBlock) => void
  onMove: (dir: "up" | "down") => void
  onDelete: () => void
}) {
  const [photoPicker, setPhotoPicker] = useState(false)
  const [videoPicker, setVideoPicker] = useState(false)

  const labelMap: Record<string, string> = {
    h2: "H2", h3: "H3", p: "P", ul: "UL", faq: "FAQ",
    carousel: "IMG", video: "VID",
  }
  const label = labelMap[block.type] ?? block.type.toUpperCase()

  return (
    <div className="group flex gap-3 rounded border border-white/8 bg-dark-card/40 p-4">
      <span className="mt-1 w-8 shrink-0 text-center text-xs font-mono text-wine">{label}</span>

      <div className="flex-1">
        {block.type === "h2" && (
          <input
            className="w-full bg-transparent font-serif text-lg text-cream outline-none placeholder:text-gray-mid"
            value={block.text}
            placeholder="Заголовок H2"
            onChange={(e) => onChange({ type: "h2", text: e.target.value })}
          />
        )}
        {block.type === "h3" && (
          <input
            className="w-full bg-transparent text-sm uppercase tracking-widest text-wine outline-none placeholder:text-gray-mid"
            value={block.text}
            placeholder="Підзаголовок H3"
            onChange={(e) => onChange({ type: "h3", text: e.target.value })}
          />
        )}
        {block.type === "p" && (
          <textarea
            rows={3}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-light outline-none placeholder:text-gray-mid"
            value={block.text}
            placeholder="Текст абзацу..."
            onChange={(e) => onChange({ type: "p", text: e.target.value })}
          />
        )}
        {block.type === "ul" && (
          <textarea
            rows={4}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-light outline-none placeholder:text-gray-mid"
            value={block.items.join("\n")}
            placeholder={"Один пункт на рядок:\nПункт 1\nПункт 2"}
            onChange={(e) =>
              onChange({ type: "ul", items: e.target.value.split("\n") })
            }
          />
        )}
        {block.type === "faq" && (
          <div className="w-full space-y-3">
            {block.items.map((item, j) => (
              <div key={j} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
                    value={item.q}
                    placeholder="Питання..."
                    onChange={(e) => {
                      const items = [...block.items]
                      items[j] = { ...items[j], q: e.target.value }
                      onChange({ type: "faq", items })
                    }}
                  />
                  <textarea
                    rows={2}
                    className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-light outline-none placeholder:text-gray-mid"
                    value={item.a}
                    placeholder="Відповідь..."
                    onChange={(e) => {
                      const items = [...block.items]
                      items[j] = { ...items[j], a: e.target.value }
                      onChange({ type: "faq", items })
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const items = block.items.filter((_, i) => i !== j)
                    onChange({ type: "faq", items })
                  }}
                  className="shrink-0 self-start text-gray-mid hover:text-red-400 text-xs mt-1"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ type: "faq", items: [...block.items, { q: "", a: "" }] })}
              className="text-xs text-wine underline"
            >
              + Питання
            </button>
          </div>
        )}

        {/* ── Carousel ── */}
        {block.type === "carousel" && (
          <div className="w-full">
            {block.photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {block.photos.map((photo, j) => (
                  <div key={j} className="group/thumb relative h-16 w-16 overflow-hidden">
                    <img src={photo.src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() =>
                        onChange({ type: "carousel", photos: block.photos.filter((_, i) => i !== j) })
                      }
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/thumb:opacity-100"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setPhotoPicker((v) => !v)}
              className="flex items-center gap-1.5 border border-white/20 px-3 py-1.5 text-xs text-gray-mid transition-colors hover:border-wine hover:text-wine"
            >
              <Images className="h-3.5 w-3.5" />
              {block.photos.length > 0 ? "Змінити фото" : "Вибрати з бібліотеки"}
            </button>
            {photoPicker && (
              <PhotoPickerPanel
                password={password}
                currentSrcs={block.photos.map((p) => p.src)}
                onApply={(photos) => onChange({ type: "carousel", photos })}
                onClose={() => setPhotoPicker(false)}
              />
            )}
          </div>
        )}

        {/* ── Video ── */}
        {block.type === "video" && (
          <div className="w-full space-y-2">
            <input
              className="w-full border-b border-white/15 bg-transparent text-xs text-cream outline-none placeholder:text-gray-mid focus:border-wine"
              value={block.title ?? ""}
              placeholder="Назва відео (необов'язково)"
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
            {block.src && (
              <p className="truncate text-xs text-gray-mid">
                ✓ {block.src.split("/").pop()}
              </p>
            )}
            <button
              onClick={() => setVideoPicker((v) => !v)}
              className="flex items-center gap-1.5 border border-white/20 px-3 py-1.5 text-xs text-gray-mid transition-colors hover:border-wine hover:text-wine"
            >
              <Video className="h-3.5 w-3.5" />
              {block.src ? "Змінити відео" : "Вибрати з бібліотеки"}
            </button>
            {videoPicker && (
              <VideoPickerPanel
                password={password}
                currentSrc={block.src}
                onApply={(src, title) =>
                  onChange({ type: "video", src, poster: block.poster, title: title ?? block.title })
                }
                onClose={() => setVideoPicker(false)}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onMove("up")}
          disabled={index === 0}
          className="rounded p-1 text-gray-mid hover:text-cream disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onMove("down")}
          disabled={index === total - 1}
          className="rounded p-1 text-gray-mid hover:text-cream disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-gray-mid hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function AddBlockBar({ onAdd }: { onAdd: (type: TopicBlock["type"]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {([
        { type: "p", label: "Абзац" },
        { type: "h2", label: "H2" },
        { type: "h3", label: "H3" },
        { type: "ul", label: "Список" },
        { type: "faq", label: "FAQ" },
        { type: "carousel", label: "Фото" },
        { type: "video", label: "Відео" },
      ] as { type: TopicBlock["type"]; label: string }[]).map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-gray-mid transition-colors hover:border-wine hover:text-wine"
        >
          <Plus className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  )
}

type BlogEditorData = Omit<BlogPost, "id" | "publishedAt" | "updatedAt">

const EMPTY_TRANSLATION: BlogPostTranslation = {
  title: "",
  description: "",
  keywords: [],
  blocks: [],
}

function getTranslation(post: BlogPost, locale: BlogLocale): BlogPostTranslation {
  if (post.translations?.[locale]) return post.translations[locale]
  if (locale === "uk") {
    return {
      title: post.title,
      description: post.description,
      keywords: post.keywords,
      blocks: post.blocks,
    }
  }
  return EMPTY_TRANSLATION
}

const EMPTY_POST: BlogEditorData = {
  slug: "",
  title: "",
  description: "",
  keywords: [],
  category: "custom",
  blocks: [],
  translations: {
    uk: EMPTY_TRANSLATION,
    en: EMPTY_TRANSLATION,
  },
  published: false,
}

function newBlock(type: TopicBlock["type"]): TopicBlock {
  if (type === "ul") return { type: "ul", items: [""] }
  if (type === "faq") return { type: "faq", items: [{ q: "", a: "" }] }
  if (type === "links") return { type: "links", items: [{ text: "", href: "" }] }
  if (type === "carousel") return { type: "carousel", photos: [] }
  if (type === "video") return { type: "video", src: "" }
  return { type, text: "" } as TopicBlock
}

export function AdminBlogEditor({ post }: { post: BlogPost | null }) {
  const router = useRouter()
  const isNew = !post
  const [activeLocale, setActiveLocale] = useState<BlogLocale>("uk")

  const [data, setData] = useState<BlogEditorData>(
    post
      ? {
          slug: post.slug,
          title: getTranslation(post, "uk").title,
          description: getTranslation(post, "uk").description,
          keywords: getTranslation(post, "uk").keywords,
          category: post.category,
          blocks: getTranslation(post, "uk").blocks,
          translations: {
            uk: getTranslation(post, "uk"),
            en: getTranslation(post, "en"),
          },
          published: post.published,
        }
      : EMPTY_POST
  )
  const [slugManual, setSlugManual] = useState(!!post)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  const set = useCallback(<K extends keyof typeof data>(k: K, v: (typeof data)[K]) => {
    setData((d) => ({ ...d, [k]: v }))
  }, [])

  const activeContent = data.translations?.[activeLocale] ?? EMPTY_TRANSLATION

  const setTranslation = useCallback(
    <K extends keyof BlogPostTranslation>(k: K, v: BlogPostTranslation[K]) => {
      setData((d) => {
        const current = d.translations?.[activeLocale] ?? EMPTY_TRANSLATION
        const nextTranslation = { ...current, [k]: v }
        const translations = {
          ...(d.translations ?? {}),
          [activeLocale]: nextTranslation,
        }

        if (activeLocale === "uk") {
          return {
            ...d,
            [k]: v,
            translations,
          }
        }

        return {
          ...d,
          translations,
        }
      })
    },
    [activeLocale]
  )

  const handleTitleChange = (title: string) => {
    setTranslation("title", title)
    if (activeLocale === "uk" && !slugManual) set("slug", toSlug(title))
  }

  const addBlock = (type: TopicBlock["type"]) => {
    setTranslation("blocks", [...activeContent.blocks, newBlock(type)])
  }

  const updateBlock = (i: number, b: TopicBlock) => {
    setTranslation("blocks", activeContent.blocks.map((bl, idx) => (idx === i ? b : bl)))
  }

  const moveBlock = (i: number, dir: "up" | "down") => {
    const blocks = [...activeContent.blocks]
    const j = dir === "up" ? i - 1 : i + 1
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    setTranslation("blocks", blocks)
  }

  const deleteBlock = (i: number) => {
    setTranslation("blocks", activeContent.blocks.filter((_, idx) => idx !== i))
  }

  const save = async (publish?: boolean) => {
    const ukContent = data.translations?.uk ?? EMPTY_TRANSLATION
    if (!ukContent.title.trim() || !data.slug.trim()) {
      setError("Заголовок і slug обов'язкові")
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      ...data,
      title: ukContent.title,
      description: ukContent.description,
      keywords: ukContent.keywords,
      blocks: ukContent.blocks,
      published: publish ?? data.published,
    }

    try {
      const res = await fetch(
        isNew ? "/api/admin/blog" : `/api/admin/blog/${post.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Помилка збереження")
      }

      router.push("/admin/blog")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка")
    } finally {
      setSaving(false)
    }
  }

  const descLen = activeContent.description.length

  return (
    <div className="min-h-screen bg-dark">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push("/admin/blog")}
            className="flex items-center gap-2 text-sm text-gray-mid transition-colors hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
            Пости
          </button>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs uppercase tracking-[0.2em] ${
                data.published ? "text-green-400" : "text-gray-mid"
              }`}
            >
              {data.published ? "Опублікований" : "Чернетка"}
            </span>

            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-28 border border-white/15 bg-transparent px-2 py-1 text-xs text-cream placeholder:text-gray-mid focus:border-wine focus:outline-none"
            />

            <button
              onClick={() => save()}
              disabled={saving}
              className="flex items-center gap-2 border border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-gray-light transition-colors hover:border-wine hover:text-cream disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              Зберегти
            </button>

            <button
              onClick={() => save(!data.published)}
              disabled={saving}
              className="flex items-center gap-2 bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {data.published ? (
                <><EyeOff className="h-3.5 w-3.5" />Зняти</>
              ) : (
                <><Globe className="h-3.5 w-3.5" />Опублікувати</>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-900/30 px-6 py-2 text-xs text-red-300">{error}</div>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded border border-white/8 bg-dark-card/30 p-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-wine">Мова контенту</p>
            <p className="mt-1 text-xs text-gray-mid">Slug, категорія і статус спільні для обох мов</p>
          </div>
          <div className="flex gap-2">
            {(["uk", "en"] as BlogLocale[]).map((locale) => (
              <button
                key={locale}
                onClick={() => setActiveLocale(locale)}
                className={`min-h-10 px-4 text-xs uppercase tracking-[0.18em] transition-colors ${
                  activeLocale === locale
                    ? "bg-wine text-cream"
                    : "border border-white/15 text-gray-mid hover:border-wine hover:text-cream"
                }`}
              >
                {locale === "uk" ? "UA" : "EN"}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <textarea
          rows={2}
          className="mb-6 w-full resize-none bg-transparent font-serif text-4xl font-light text-cream outline-none placeholder:text-gray-mid/40 md:text-5xl"
          placeholder={activeLocale === "uk" ? "Заголовок посту..." : "Post title..."}
          value={activeContent.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        {/* Meta fields */}
        <div className="mb-8 grid gap-4 rounded border border-white/8 bg-dark-card/30 p-6 md:grid-cols-2">
          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-wine">
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-mid">/blog/</span>
              <input
                className="flex-1 border-b border-white/15 bg-transparent text-sm text-cream outline-none focus:border-wine"
                value={data.slug}
                onChange={(e) => {
                  setSlugManual(true)
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }}
                placeholder="nazva-posta"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-wine">
              Категорія
            </label>
            <select
              className="w-full border-b border-white/15 bg-dark text-sm text-cream outline-none focus:border-wine"
              value={data.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-wine">
              <span>Meta Description</span>
              <span className={descLen > 160 ? "text-red-400" : descLen > 130 ? "text-yellow-400" : "text-gray-mid"}>
                {descLen}/160
              </span>
            </label>
            <textarea
              rows={2}
              className="w-full resize-none border-b border-white/15 bg-transparent text-sm leading-relaxed text-cream outline-none placeholder:text-gray-mid focus:border-wine"
              placeholder="Короткий опис для Google (130–160 символів)..."
              value={activeContent.description}
              onChange={(e) => setTranslation("description", e.target.value)}
            />
          </div>

          {/* Keywords */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-wine">
              Keywords (через кому)
            </label>
            <input
              className="w-full border-b border-white/15 bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid focus:border-wine"
              placeholder="весільна зйомка, фотограф Черкаси..."
              value={activeContent.keywords.join(", ")}
              onChange={(e) =>
                setTranslation(
                  "keywords",
                  e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                )
              }
            />
          </div>
        </div>

        {/* Preview */}
        {activeContent.title && activeContent.description && (
          <div className="mb-8 rounded border border-white/8 bg-dark-card/20 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-wine">
              <Eye className="mr-1 inline h-3 w-3" />
              Google Preview
            </p>
            <p className="text-sm text-blue-400 underline">
              metime.in.ua › blog › {data.slug || "..."}
            </p>
            <p className="text-sm font-medium text-cream">{activeContent.title} | MeTime Studio</p>
            <p className="text-xs text-gray-mid">{activeContent.description}</p>
          </div>
        )}

        {/* Content blocks */}
        <div className="mb-4">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-wine">Контент</p>
          <div className="mb-4 flex flex-col gap-2">
            {activeContent.blocks.map((block, i) => (
              <BlockRow
                key={i}
                block={block}
                index={i}
                total={activeContent.blocks.length}
                password={password}
                onChange={(b) => updateBlock(i, b)}
                onMove={(dir) => moveBlock(i, dir)}
                onDelete={() => deleteBlock(i)}
              />
            ))}
          </div>
          <AddBlockBar onAdd={addBlock} />
        </div>
      </div>
    </div>
  )
}
