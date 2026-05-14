"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Globe, Eye, EyeOff, ArrowLeft } from "lucide-react"
import type { BlogPost, TopicBlock } from "@/lib/blog/types"

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

function toSlug(str: string) {
  return str.toLowerCase()
    .split("").map((c) => TRANSLIT[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function BlockRow({
  block,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  block: TopicBlock
  index: number
  total: number
  onChange: (b: TopicBlock) => void
  onMove: (dir: "up" | "down") => void
  onDelete: () => void
}) {
  const label = { h2: "H2", h3: "H3", p: "P", ul: "UL" }[block.type]

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

const EMPTY_POST: Omit<BlogPost, "id" | "publishedAt" | "updatedAt"> = {
  slug: "",
  title: "",
  description: "",
  keywords: [],
  category: "custom",
  blocks: [],
  published: false,
}

function newBlock(type: TopicBlock["type"]): TopicBlock {
  if (type === "ul") return { type: "ul", items: [""] }
  if (type === "faq") return { type: "faq", items: [{ q: "", a: "" }] }
  if (type === "links") return { type: "links", items: [{ text: "", href: "" }] }
  return { type, text: "" } as TopicBlock
}

export function AdminBlogEditor({ post }: { post: BlogPost | null }) {
  const router = useRouter()
  const isNew = !post

  const [data, setData] = useState<Omit<BlogPost, "id" | "publishedAt" | "updatedAt">>(
    post
      ? {
          slug: post.slug,
          title: post.title,
          description: post.description,
          keywords: post.keywords,
          category: post.category,
          blocks: post.blocks,
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

  const handleTitleChange = (title: string) => {
    set("title", title)
    if (!slugManual) set("slug", toSlug(title))
  }

  const addBlock = (type: TopicBlock["type"]) => {
    set("blocks", [...data.blocks, newBlock(type)])
  }

  const updateBlock = (i: number, b: TopicBlock) => {
    set("blocks", data.blocks.map((bl, idx) => (idx === i ? b : bl)))
  }

  const moveBlock = (i: number, dir: "up" | "down") => {
    const blocks = [...data.blocks]
    const j = dir === "up" ? i - 1 : i + 1
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    set("blocks", blocks)
  }

  const deleteBlock = (i: number) => {
    set("blocks", data.blocks.filter((_, idx) => idx !== i))
  }

  const save = async (publish?: boolean) => {
    if (!data.title.trim() || !data.slug.trim()) {
      setError("Заголовок і slug обов'язкові")
      return
    }
    setSaving(true)
    setError(null)

    const payload = { ...data, published: publish ?? data.published }

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

  const descLen = data.description.length

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
        {/* Title */}
        <textarea
          rows={2}
          className="mb-6 w-full resize-none bg-transparent font-serif text-4xl font-light text-cream outline-none placeholder:text-gray-mid/40 md:text-5xl"
          placeholder="Заголовок посту..."
          value={data.title}
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
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
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
              value={data.keywords.join(", ")}
              onChange={(e) =>
                set(
                  "keywords",
                  e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                )
              }
            />
          </div>
        </div>

        {/* Preview */}
        {data.title && data.description && (
          <div className="mb-8 rounded border border-white/8 bg-dark-card/20 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-wine">
              <Eye className="mr-1 inline h-3 w-3" />
              Google Preview
            </p>
            <p className="text-sm text-blue-400 underline">
              metime.in.ua › blog › {data.slug || "..."}
            </p>
            <p className="text-sm font-medium text-cream">{data.title} | MeTime Studio</p>
            <p className="text-xs text-gray-mid">{data.description}</p>
          </div>
        )}

        {/* Content blocks */}
        <div className="mb-4">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-wine">Контент</p>
          <div className="mb-4 flex flex-col gap-2">
            {data.blocks.map((block, i) => (
              <BlockRow
                key={i}
                block={block}
                index={i}
                total={data.blocks.length}
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
