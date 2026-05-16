import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readBlogPosts, saveBlogPosts } from "@/lib/blog/storage"
import type { BlogPost, BlogPostTranslation } from "@/lib/blog/types"

function getUkContent(existing: BlogPost, body: Partial<BlogPost>): BlogPostTranslation {
  return {
    title: body.translations?.uk?.title ?? body.title ?? existing.title ?? "",
    description: body.translations?.uk?.description ?? body.description ?? existing.description ?? "",
    keywords: body.translations?.uk?.keywords ?? body.keywords ?? existing.keywords ?? [],
    blocks: body.translations?.uk?.blocks ?? body.blocks ?? existing.blocks ?? [],
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = await readBlogPosts()
  const post = posts.find((p) => p.id === id)
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json() as Partial<BlogPost>
  const posts = await readBlogPosts()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const existing = posts[idx]
  const now = new Date().toISOString()
  const wasPublished = existing.published
  const isPublishing = body.published && !wasPublished
  const uk = getUkContent(existing, body)

  if (
    body.slug &&
    body.slug !== existing.slug &&
    posts.some((p) => p.id !== id && p.slug === body.slug)
  ) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
  }

  const updated: BlogPost = {
    ...existing,
    ...body,
    id,
    title: uk.title,
    description: uk.description,
    keywords: uk.keywords,
    blocks: uk.blocks,
    translations: {
      ...(existing.translations ?? {}),
      ...(body.translations ?? {}),
      uk,
      en: body.translations?.en ?? existing.translations?.en ?? {
        title: "",
        description: "",
        keywords: [],
        blocks: [],
      },
    },
    publishedAt: isPublishing ? now : existing.publishedAt,
    updatedAt: now,
  }

  posts[idx] = updated
  await saveBlogPosts(posts)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params
  const posts = await readBlogPosts()
  const filtered = posts.filter((p) => p.id !== id)
  if (filtered.length === posts.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await saveBlogPosts(filtered)
  return NextResponse.json({ ok: true })
}
