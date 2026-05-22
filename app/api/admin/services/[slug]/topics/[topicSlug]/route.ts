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
  const log: string[] = []

  try {
    // 1. Auth
    const authError = requireAdminAuth(request)
    if (authError) {
      log.push("AUTH_FAIL: wrong or missing password")
      return NextResponse.json({ error: "Unauthorized", log }, { status: 401 })
    }
    log.push("AUTH_OK")

    // 2. Params
    const { slug, topicSlug } = await params
    log.push(`PARAMS: slug=${slug} topicSlug=${topicSlug}`)

    // 3. Body
    const body = await request.json() as {
      title?: string
      description?: string
      keywords?: string[]
      publishedAt?: string
      blocks?: TopicBlock[]
    }
    log.push(`BODY: title=${body.title?.slice(0, 40)} blocks=${body.blocks?.length ?? "none"}`)

    // 4. Read current data
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    log.push(`BLOB_TOKEN_PRESENT: ${hasBlobToken}`)

    const services = await readServices()
    log.push(`READ: ${services.length} services loaded`)

    const serviceIdx = services.findIndex((s) => s.slug === slug)
    if (serviceIdx === -1) {
      log.push(`ERROR: service '${slug}' not found in loaded data`)
      return NextResponse.json({ error: "Service not found", log }, { status: 404 })
    }

    const topicIdx = services[serviceIdx].topics.findIndex((t) => t.slug === topicSlug)
    if (topicIdx === -1) {
      log.push(`ERROR: topic '${topicSlug}' not found in service '${slug}'`)
      return NextResponse.json({ error: "Topic not found", log }, { status: 404 })
    }
    log.push(`FOUND: service[${serviceIdx}].topics[${topicIdx}]`)

    // 5. Apply changes
    const before = services[serviceIdx].topics[topicIdx].title
    services[serviceIdx].topics[topicIdx] = {
      ...services[serviceIdx].topics[topicIdx],
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.publishedAt !== undefined && { publishedAt: body.publishedAt }),
      ...(body.blocks !== undefined && { blocks: body.blocks }),
    }
    const after = services[serviceIdx].topics[topicIdx].title
    log.push(`MERGE: title '${before}' → '${after}'`)

    // 6. Save
    await saveServices(services)
    log.push("SAVE_OK")

    // 7. Revalidate
    revalidatePath(`/${slug}`)
    revalidatePath(`/${slug}/${topicSlug}`)
    revalidatePath("/blog")
    revalidatePath("/sitemap.xml")
    log.push("REVALIDATE_OK")

    return NextResponse.json({ ok: true, log, topic: services[serviceIdx].topics[topicIdx] })
  } catch (err) {
    log.push(`EXCEPTION: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ error: "Internal error", log }, { status: 500 })
  }
}
