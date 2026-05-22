"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, ArrowLeft,
  Images, Video, Check, X,
} from "lucide-react"
import type { ServiceData, ServiceTopic, TopicBlock, CarouselPhoto } from "@/lib/services/types"

// ─── Portfolio library types ──────────────────────────────────────────────────

type PortfolioPhoto = { id: string; filename: string; src?: string; category?: string }
type PortfolioVideo = { id: string; filename: string; src?: string; category?: string; title?: string }

const CATEGORY_LABELS: Record<string, string> = {
  dance: "танцювальна", wedding: "весілля", kids: "діти",
  brand: "бренд", custom: "кастом", lovestory: "love story", portrait: "портрет",
}

function photoSrc(p: PortfolioPhoto) { return p.src || `/images/portfolio/${p.filename}` }
function videoSrc(v: PortfolioVideo) { return v.src || `/videos/portfolio/${v.filename}` }

// ─── Photo picker panel ───────────────────────────────────────────────────────

function PhotoPickerPanel({
  password, currentSrcs, onApply, onClose,
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

  const toggle = (src: string) =>
    setPicks((prev) => { const n = new Set(prev); n.has(src) ? n.delete(src) : n.add(src); return n })

  const apply = () => {
    const ordered = (photos ?? [])
      .filter((p) => picks.has(photoSrc(p)))
      .map((p) => ({
        src: photoSrc(p),
        alt: `MeTime Studio — ${CATEGORY_LABELS[p.category ?? ""] ?? "зйомка"}`,
      }))
    onApply(ordered)
    onClose()
  }

  const cats = ["all", ...Array.from(new Set((photos ?? []).map((p) => p.category).filter(Boolean)))]
  const visible = filter === "all" ? photos ?? [] : (photos ?? []).filter((p) => p.category === filter)

  return (
    <div className="mt-2 rounded border border-wine/30 bg-dark p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-wine">
          <Images className="mr-1.5 inline h-3 w-3" />
          Бібліотека фото ({picks.size} обрано)
        </span>
        <button onClick={onClose} className="text-gray-mid hover:text-cream"><X className="h-4 w-4" /></button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c ?? "all")}
            className={`border px-2 py-0.5 text-xs uppercase tracking-[0.1em] transition-colors ${
              filter === c ? "border-wine text-wine" : "border-white/15 text-gray-mid hover:border-white/40"
            }`}>
            {c === "all" ? "Всі" : CATEGORY_LABELS[c ?? ""] ?? c}
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
              <button key={photo.id} onClick={() => toggle(src)}
                className={`relative aspect-square overflow-hidden border-2 transition-colors ${selected ? "border-wine" : "border-transparent"}`}>
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
        <button onClick={onClose}
          className="border border-white/15 px-3 py-1.5 text-xs text-gray-mid hover:text-cream">
          Скасувати
        </button>
        <button onClick={apply}
          className="bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream hover:opacity-90">
          Застосувати ({picks.size})
        </button>
      </div>
    </div>
  )
}

// ─── Video picker panel ───────────────────────────────────────────────────────

function VideoPickerPanel({
  password, currentSrc, onApply, onClose,
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
    <div className="mt-2 rounded border border-wine/30 bg-dark p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-wine">
          <Video className="mr-1.5 inline h-3 w-3" />
          Бібліотека відео
        </span>
        <button onClick={onClose} className="text-gray-mid hover:text-cream"><X className="h-4 w-4" /></button>
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
              <button key={v.id} onClick={() => setPicked(src)}
                className={`flex w-full items-center gap-3 rounded border px-3 py-2 text-left transition-colors ${
                  isSelected ? "border-wine bg-wine/10" : "border-white/8 hover:border-white/20"
                }`}>
                <Video className={`h-4 w-4 shrink-0 ${isSelected ? "text-wine" : "text-gray-mid"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-cream">{v.title || v.filename}</p>
                  {v.category && (
                    <p className="text-xs text-gray-mid">{CATEGORY_LABELS[v.category] ?? v.category}</p>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-wine" />}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose}
          className="border border-white/15 px-3 py-1.5 text-xs text-gray-mid hover:text-cream">
          Скасувати
        </button>
        <button onClick={apply} disabled={!picked}
          className="bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream hover:opacity-90 disabled:opacity-40">
          Застосувати
        </button>
      </div>
    </div>
  )
}

// ─── Block row ────────────────────────────────────────────────────────────────

function BlockRow({
  block, index, total, onChange, onMove, onDelete, password,
}: {
  block: TopicBlock; index: number; total: number; password: string
  onChange: (b: TopicBlock) => void; onMove: (dir: "up" | "down") => void; onDelete: () => void
}) {
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [showVideoPicker, setShowVideoPicker] = useState(false)

  const label = { h2: "H2", h3: "H3", p: "P", ul: "UL", links: "→", faq: "FAQ", carousel: "IMG", video: "VID" }[block.type]

  return (
    <div className="group flex gap-3 rounded border border-white/8 bg-dark-card/40 p-4">
      <span className="mt-1 w-10 shrink-0 text-center text-xs font-mono text-wine">{label}</span>
      <div className="flex-1">
        {block.type === "h2" && (
          <input className="w-full bg-transparent font-serif text-lg text-cream outline-none placeholder:text-gray-mid"
            value={block.text} placeholder="Заголовок H2"
            onChange={(e) => onChange({ type: "h2", text: e.target.value })} />
        )}
        {block.type === "h3" && (
          <input className="w-full bg-transparent text-sm uppercase tracking-widest text-wine outline-none placeholder:text-gray-mid"
            value={block.text} placeholder="Підзаголовок H3"
            onChange={(e) => onChange({ type: "h3", text: e.target.value })} />
        )}
        {block.type === "p" && (
          <textarea rows={3} className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-light outline-none placeholder:text-gray-mid"
            value={block.text} placeholder="Текст абзацу..."
            onChange={(e) => onChange({ type: "p", text: e.target.value })} />
        )}
        {block.type === "ul" && (
          <textarea rows={4} className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-light outline-none placeholder:text-gray-mid"
            value={block.items.join("\n")} placeholder={"Пункт 1\nПункт 2"}
            onChange={(e) => onChange({ type: "ul", items: e.target.value.split("\n") })} />
        )}
        {block.type === "links" && (
          <div className="w-full space-y-2">
            <input className="w-full bg-transparent text-xs uppercase tracking-widest text-wine outline-none placeholder:text-gray-mid border-b border-white/10 pb-1"
              value={block.heading ?? ""} placeholder="Заголовок (необов'язково)"
              onChange={(e) => onChange({ type: "links", heading: e.target.value, items: block.items })} />
            <textarea rows={3} className="w-full resize-none bg-transparent text-sm text-gray-light outline-none placeholder:text-gray-mid"
              value={block.items.map(i => `${i.text}|${i.href}`).join("\n")}
              placeholder={"Назва|/шлях\nДруге посилання|/шлях2"}
              onChange={(e) => {
                const items = e.target.value.split("\n").map(line => {
                  const [text, href = ""] = line.split("|")
                  return { text: text?.trim() ?? "", href: href.trim() }
                })
                onChange({ type: "links", heading: block.heading, items })
              }} />
          </div>
        )}
        {block.type === "faq" && (
          <div className="w-full space-y-3">
            {block.items.map((item, j) => (
              <div key={j} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
                    value={item.q} placeholder="Питання..."
                    onChange={(e) => {
                      const items = [...block.items]
                      items[j] = { ...items[j], q: e.target.value }
                      onChange({ type: "faq", items })
                    }} />
                  <textarea rows={2} className="w-full resize-none bg-transparent text-sm text-gray-light outline-none placeholder:text-gray-mid"
                    value={item.a} placeholder="Відповідь..."
                    onChange={(e) => {
                      const items = [...block.items]
                      items[j] = { ...items[j], a: e.target.value }
                      onChange({ type: "faq", items })
                    }} />
                </div>
                <button onClick={() => onChange({ type: "faq", items: block.items.filter((_, i) => i !== j) })}
                  className="shrink-0 self-start text-gray-mid hover:text-red-400 text-xs mt-1">✕</button>
              </div>
            ))}
            <button onClick={() => onChange({ type: "faq", items: [...block.items, { q: "", a: "" }] })}
              className="text-xs text-wine underline">+ Питання</button>
          </div>
        )}
        {block.type === "carousel" && (
          <div className="w-full space-y-2">
            {block.photos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {block.photos.map((photo, j) => (
                  <div key={j} className="relative h-16 w-16 shrink-0 overflow-hidden">
                    <img src={photo.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <button
                      onClick={() => onChange({ type: "carousel", photos: block.photos.filter((_, i) => i !== j) })}
                      className="absolute right-0 top-0 bg-dark/75 p-0.5 text-gray-mid hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowPhotoPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-wine hover:underline">
              <Images className="h-3 w-3" />
              {showPhotoPicker ? "Закрити" : `Обрати фото з бібліотеки (${block.photos.length} фото)`}
            </button>
            {showPhotoPicker && (
              <PhotoPickerPanel
                password={password}
                currentSrcs={block.photos.map((p) => p.src)}
                onApply={(photos) => { onChange({ type: "carousel", photos }); setShowPhotoPicker(false) }}
                onClose={() => setShowPhotoPicker(false)}
              />
            )}
          </div>
        )}
        {block.type === "video" && (
          <div className="w-full space-y-2">
            {block.src && (
              <p className="truncate text-xs text-gray-light">{block.src.split("/").pop()}</p>
            )}
            <button onClick={() => setShowVideoPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-wine hover:underline">
              <Video className="h-3 w-3" />
              {showVideoPicker ? "Закрити" : block.src ? "Змінити відео" : "Обрати відео з бібліотеки"}
            </button>
            {showVideoPicker && (
              <VideoPickerPanel
                password={password}
                currentSrc={block.src}
                onApply={(src, title) => { onChange({ type: "video", src, poster: block.poster, title }); setShowVideoPicker(false) }}
                onClose={() => setShowVideoPicker(false)}
              />
            )}
            <input
              className="w-full bg-transparent text-xs text-gray-light outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
              value={block.poster ?? ""} placeholder="Poster URL (необов'язково)..."
              onChange={(e) => onChange({ type: "video", src: block.src, poster: e.target.value || undefined, title: block.title })} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => onMove("up")} disabled={index === 0} className="rounded p-1 text-gray-mid hover:text-cream disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
        <button onClick={() => onMove("down")} disabled={index === total - 1} className="rounded p-1 text-gray-mid hover:text-cream disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="rounded p-1 text-gray-mid hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  )
}

// ─── New block defaults ───────────────────────────────────────────────────────

function newBlock(type: TopicBlock["type"]): TopicBlock {
  if (type === "ul") return { type: "ul", items: [""] }
  if (type === "faq") return { type: "faq", items: [{ q: "", a: "" }] }
  if (type === "links") return { type: "links", items: [{ text: "", href: "" }] }
  if (type === "carousel") return { type: "carousel", photos: [] }
  if (type === "video") return { type: "video", src: "" }
  return { type, text: "" } as TopicBlock
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function AdminServiceTopicEditor({
  service,
  topic,
}: {
  service: ServiceData
  topic: ServiceTopic
}) {
  const router = useRouter()
  const [title, setTitle] = useState(topic.title)
  const [description, setDescription] = useState(topic.description)
  const [keywords, setKeywords] = useState(topic.keywords.join(", "))
  const [publishedAt, setPublishedAt] = useState(topic.publishedAt)
  const [blocks, setBlocks] = useState<TopicBlock[]>(topic.blocks)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  const updateBlock = (i: number, b: TopicBlock) =>
    setBlocks((prev) => prev.map((bl, idx) => (idx === i ? b : bl)))

  const moveBlock = (i: number, dir: "up" | "down") => {
    const arr = [...blocks]
    const j = dir === "up" ? i - 1 : i + 1
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setBlocks(arr)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/services/${service.slug}/topics/${topic.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({
          title,
          description,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          publishedAt,
          blocks,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const logStr = Array.isArray(data.log) ? "\n" + data.log.join("\n") : ""
        throw new Error((data.error ?? "Помилка") + logStr)
      }
      const logStr = Array.isArray(data.log) ? data.log.join(" → ") : ""
      setError(`✓ Збережено. ${logStr}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка")
    } finally {
      setSaving(false)
    }
  }

  const descLen = description.length

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <button onClick={() => router.push("/admin/blog")} className="flex items-center gap-2 text-sm text-gray-mid hover:text-cream transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Пости
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-mid">{service.name} / {topic.slug}</span>
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-28 border border-white/15 bg-transparent px-2 py-1 text-xs text-cream placeholder:text-gray-mid focus:border-wine focus:outline-none" />
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-wine px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-cream hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Save className="h-3.5 w-3.5" />
              Зберегти
            </button>
          </div>
        </div>
        {error && (
          <div className={`px-6 py-2 text-xs whitespace-pre-wrap ${error.startsWith("✓") ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
            {error}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Title */}
        <textarea rows={2} className="mb-6 w-full resize-none bg-transparent font-serif text-4xl font-light text-cream outline-none placeholder:text-gray-mid/40"
          value={title} placeholder="Заголовок..." onChange={(e) => setTitle(e.target.value)} />

        {/* Meta */}
        <div className="mb-8 grid gap-4 rounded border border-white/8 bg-dark-card/30 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-wine">
              <span>Meta Description</span>
              <span className={descLen > 160 ? "text-red-400" : "text-gray-mid"}>{descLen}/160</span>
            </label>
            <textarea rows={2} className="w-full resize-none border-b border-white/15 bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid focus:border-wine"
              value={description} placeholder="Опис для Google..."
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-wine">Keywords</label>
            <input className="w-full border-b border-white/15 bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid focus:border-wine"
              value={keywords} placeholder="ключове слово, ще одне..."
              onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-wine">Дата публікації</label>
            <input type="date" className="w-full border-b border-white/15 bg-transparent text-sm text-cream outline-none focus:border-wine"
              value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </div>
        </div>

        {/* Blocks */}
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-wine">Контент</p>
          <div className="mb-4 flex flex-col gap-2">
            {blocks.map((block, i) => (
              <BlockRow key={i} block={block} index={i} total={blocks.length} password={password}
                onChange={(b) => updateBlock(i, b)}
                onMove={(dir) => moveBlock(i, dir)}
                onDelete={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["p", "h2", "h3", "ul", "faq", "links", "carousel", "video"] as TopicBlock["type"][]).map((type) => (
              <button key={type} onClick={() => setBlocks((prev) => [...prev, newBlock(type)])}
                className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-gray-mid hover:border-wine hover:text-wine transition-colors">
                <Plus className="h-3 w-3" />
                {type === "p" ? "Абзац" : type === "h2" ? "H2" : type === "h3" ? "H3" : type === "ul" ? "Список" : type === "faq" ? "FAQ" : type === "links" ? "Посилання" : type === "carousel" ? "Карусель" : "Відео"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
