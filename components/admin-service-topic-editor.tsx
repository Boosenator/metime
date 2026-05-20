"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Save, ArrowLeft } from "lucide-react"
import type { ServiceData, ServiceTopic, TopicBlock, FaqItem } from "@/lib/services/types"

function BlockRow({
  block, index, total, onChange, onMove, onDelete,
}: {
  block: TopicBlock; index: number; total: number
  onChange: (b: TopicBlock) => void; onMove: (dir: "up" | "down") => void; onDelete: () => void
}) {
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
            {block.photos.map((photo, j) => (
              <div key={j} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
                    value={photo.src} placeholder="URL фото..."
                    onChange={(e) => {
                      const photos = [...block.photos]
                      photos[j] = { ...photos[j], src: e.target.value }
                      onChange({ type: "carousel", photos })
                    }} />
                  <input
                    className="w-full bg-transparent text-xs text-gray-light outline-none placeholder:text-gray-mid focus:border-wine"
                    value={photo.alt} placeholder="Alt текст..."
                    onChange={(e) => {
                      const photos = [...block.photos]
                      photos[j] = { ...photos[j], alt: e.target.value }
                      onChange({ type: "carousel", photos })
                    }} />
                </div>
                <button
                  onClick={() => onChange({ type: "carousel", photos: block.photos.filter((_, i) => i !== j) })}
                  className="shrink-0 self-start text-gray-mid hover:text-red-400 text-xs mt-1">✕</button>
              </div>
            ))}
            <button
              onClick={() => onChange({ type: "carousel", photos: [...block.photos, { src: "", alt: "" }] })}
              className="text-xs text-wine underline">+ Фото</button>
          </div>
        )}
        {block.type === "video" && (
          <div className="w-full space-y-2">
            <input
              className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
              value={block.src} placeholder="URL відео..."
              onChange={(e) => onChange({ type: "video", src: e.target.value, poster: block.poster, title: block.title })} />
            <input
              className="w-full bg-transparent text-xs text-gray-light outline-none placeholder:text-gray-mid border-b border-white/10 pb-1 focus:border-wine"
              value={block.poster ?? ""} placeholder="Poster URL (необов'язково)..."
              onChange={(e) => onChange({ type: "video", src: block.src, poster: e.target.value || undefined, title: block.title })} />
            <input
              className="w-full bg-transparent text-xs text-gray-light outline-none placeholder:text-gray-mid focus:border-wine"
              value={block.title ?? ""} placeholder="Підпис (необов'язково)..."
              onChange={(e) => onChange({ type: "video", src: block.src, poster: block.poster, title: e.target.value || undefined })} />
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

function newBlock(type: TopicBlock["type"]): TopicBlock {
  if (type === "ul") return { type: "ul", items: [""] }
  if (type === "faq") return { type: "faq", items: [{ q: "", a: "" }] }
  if (type === "links") return { type: "links", items: [{ text: "", href: "" }] }
  if (type === "carousel") return { type: "carousel", photos: [] }
  if (type === "video") return { type: "video", src: "" }
  return { type, text: "" } as TopicBlock
}

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
      if (!res.ok) throw new Error((await res.json()).error ?? "Помилка")
      router.push("/admin/blog")
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
        {error && <div className="bg-red-900/30 px-6 py-2 text-xs text-red-300">{error}</div>}
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
              <BlockRow key={i} block={block} index={i} total={blocks.length}
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
