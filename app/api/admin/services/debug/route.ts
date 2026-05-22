import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { get } from "@vercel/blob"
import { readServicesSync } from "@/lib/services/storage"

const BLOB_KEY = "services/services.json"

export async function GET(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const result: Record<string, unknown> = {}

  // 1. Env check
  result.BLOB_TOKEN_PRESENT = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  result.NODE_ENV = process.env.NODE_ENV

  // 2. Local file
  try {
    const local = readServicesSync()
    result.LOCAL_SERVICES_COUNT = local.length
    result.LOCAL_WEDDING_TOPICS = local.find(s => s.slug === "wedding")?.topics?.map(t => ({
      slug: t.slug,
      title: t.title.slice(0, 60),
      blocks: t.blocks.length,
    }))
  } catch (e) {
    result.LOCAL_ERROR = String(e)
  }

  // 3. Blob — raw read
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await get(BLOB_KEY, { access: "public", useCache: false })
      if (!blob || blob.statusCode !== 200 || !blob.stream) {
        result.BLOB_STATUS = `get() returned: ${JSON.stringify(blob)}`
      } else {
        const data = await new Response(blob.stream).json() as { slug: string; topics?: { slug: string; title: string; blocks: unknown[] }[] }[]
        result.BLOB_SERVICES_COUNT = data.length
        result.BLOB_WEDDING_TOPICS = data.find(s => s.slug === "wedding")?.topics?.map(t => ({
          slug: t.slug,
          title: t.title.slice(0, 60),
          blocks: t.blocks.length,
        }))
        result.BLOB_STATUS = "OK"
      }
    } catch (e) {
      result.BLOB_ERROR = String(e)
    }
  } else {
    result.BLOB_STATUS = "SKIPPED (no token)"
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
