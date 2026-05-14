"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Globe, EyeOff } from "lucide-react"
import type { BlogPost } from "@/lib/blog/types"

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Весілля", dance: "Танець", kids: "Діти",
  brand: "Бренд", lovestory: "Love Story", portrait: "Портрет", custom: "Інше",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function AdminBlogList({ initialPosts }: { initialPosts: BlogPost[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  const deletePost = async (id: string) => {
    if (!confirm("Видалити пост?")) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      })
      setPosts((p) => p.filter((post) => post.id !== id))
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-2xl font-light text-cream">Блог</h1>
            <p className="text-xs text-gray-mid">{posts.length} постів</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="Пароль адміна"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-32 border border-white/15 bg-transparent px-2 py-1 text-xs text-cream placeholder:text-gray-mid focus:border-wine focus:outline-none"
            />
            <button
              onClick={() => router.push("/admin/blog/new")}
              className="flex items-center gap-2 bg-wine px-4 py-2 text-xs uppercase tracking-[0.15em] text-cream transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Новий пост
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-2 text-gray-mid">Поки немає постів</p>
            <button
              onClick={() => router.push("/admin/blog/new")}
              className="mt-4 text-sm text-wine underline"
            >
              Створити перший пост
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {posts
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((post) => (
                <div
                  key={post.id}
                  className="group flex items-start justify-between gap-4 py-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-3">
                      <span
                        className={`text-xs uppercase tracking-[0.15em] ${
                          post.published ? "text-green-400" : "text-gray-mid"
                        }`}
                      >
                        {post.published ? (
                          <><Globe className="mr-1 inline h-3 w-3" />Опублікований</>
                        ) : (
                          <><EyeOff className="mr-1 inline h-3 w-3" />Чернетка</>
                        )}
                      </span>
                      <span className="text-xs text-gray-mid">
                        {CATEGORY_LABELS[post.category] ?? post.category}
                      </span>
                    </div>
                    <h2 className="mb-1 font-serif text-lg font-light text-cream truncate">
                      {post.title || <span className="text-gray-mid italic">Без назви</span>}
                    </h2>
                    <p className="text-xs text-gray-mid">
                      /blog/{post.slug} · оновлено {formatDate(post.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => router.push(`/admin/blog/${post.id}`)}
                      className="flex items-center gap-1.5 border border-white/15 px-3 py-1.5 text-xs text-gray-mid transition-colors hover:border-wine hover:text-cream"
                    >
                      <Pencil className="h-3 w-3" />
                      Редагувати
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={deleting === post.id}
                      className="border border-white/15 p-1.5 text-gray-mid transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
