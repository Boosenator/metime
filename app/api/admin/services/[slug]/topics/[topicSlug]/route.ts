import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { readServices, saveServices } from "@/lib/services/storage"
import type { TopicBlock } from "@/lib/services/types"

type Params = { params: Promise<{ slug: string; topicSlug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { slug, topicSlug } = await params
  const services = await readServices()
  const service = services.find((s) => s.slug === slug)
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 })
  const topic = service.topics.find((t) => t.slug === topicSlug)
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 })
  return NextResponse.json({ service, topic })
}

export async function PUT(request: Request, { params }: Params) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { slug, topicSlug } = await params
  const body = await request.json() as {
    title?: string
    description?: string
    keywords?: string[]
    publishedAt?: string
    blocks?: TopicBlock[]
  }

  const services = await readServices()
  const serviceIdx = services.findIndex((s) => s.slug === slug)
  if (serviceIdx === -1) return NextResponse.json({ error: "Service not found" }, { status: 404 })

  const topicIdx = services[serviceIdx].topics.findIndex((t) => t.slug === topicSlug)
  if (topicIdx === -1) return NextResponse.json({ error: "Topic not found" }, { status: 404 })

  services[serviceIdx].topics[topicIdx] = {
    ...services[serviceIdx].topics[topicIdx],
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.keywords !== undefined && { keywords: body.keywords }),
    ...(body.publishedAt !== undefined && { publishedAt: body.publishedAt }),
    ...(body.blocks !== undefined && { blocks: body.blocks }),
  }

  await saveServices(services)
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/${topicSlug}`)
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")

  return NextResponse.json(services[serviceIdx].topics[topicIdx])
}
