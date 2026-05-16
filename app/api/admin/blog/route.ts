import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readBlogPosts, saveBlogPosts } from "@/lib/blog/storage"
import type { BlogPost, BlogPostTranslation } from "@/lib/blog/types"

function getUkContent(body: Partial<BlogPost>): BlogPostTranslation {
  return {
    title: body.translations?.uk?.title ?? body.title ?? "",
    description: body.translations?.uk?.description ?? body.description ?? "",
    keywords: body.translations?.uk?.keywords ?? body.keywords ?? [],
    blocks: body.translations?.uk?.blocks ?? body.blocks ?? [],
  }
}

export async function GET() {
  const posts = await readBlogPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const body = await request.json() as Partial<BlogPost>

  const uk = getUkContent(body)

  if (!uk.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }
  if (!body.slug?.trim()) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const posts = await readBlogPosts()

  if (posts.some((p) => p.slug === body.slug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
  }

  const now = new Date().toISOString()
  const post: BlogPost = {
    id: crypto.randomUUID(),
    slug: body.slug,
    title: uk.title,
    description: uk.description,
    keywords: uk.keywords,
    category: body.category ?? "custom",
    blocks: uk.blocks,
    translations: {
      ...(body.translations ?? {}),
      uk,
      en: body.translations?.en ?? {
        title: "",
        description: "",
        keywords: [],
        blocks: [],
      },
    },
    published: body.published ?? false,
    publishedAt: body.published ? now : (body.publishedAt ?? now),
    updatedAt: now,
  }

  await saveBlogPosts([...posts, post])
  return NextResponse.json(post, { status: 201 })
}
