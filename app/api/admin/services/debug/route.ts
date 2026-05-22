import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { list } from "@vercel/blob"
import { readServicesSync } from "@/lib/services/storage"

const BLOB_KEY = "services/services.json"

export async function GET(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const result: Record<string, unknown> = {}

  result.BLOB_TOKEN_PRESENT = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  result.NODE_ENV = process.env.NODE_ENV

  // Local file
  try {
    const local = readServicesSync()
    result.LOCAL_SERVICES_COUNT = local.length
    result.LOCAL_WEDDING_TSINY_BLOCKS = local
      .find(s => s.slug === "wedding")?.topics
      .find(t => t.slug === "tsiny")?.blocks.length ?? "not found"
  } catch (e) {
    result.LOCAL_ERROR = String(e)
  }

  // Blob via list() + fetch()
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: BLOB_KEY })
      const blob = blobs.find(b => b.pathname === BLOB_KEY)
      if (!blob) {
        result.BLOB_STATUS = "NOT_FOUND in list()"
        result.ALL_BLOBS = blobs.map(b => b.pathname)
      } else {
        result.BLOB_URL = blob.url
        const res = await fetch(blob.url, { cache: "no-store" })
        if (!res.ok) {
          result.BLOB_STATUS = `fetch failed: ${res.status}`
        } else {
          const data = await res.json() as { slug: string; topics?: { slug: string; title: string; blocks: unknown[] }[] }[]
          result.BLOB_STATUS = "OK"
          result.BLOB_SERVICES_COUNT = data.length
          result.BLOB_WEDDING_TSINY_BLOCKS = data
            .find(s => s.slug === "wedding")?.topics
            ?.find(t => t.slug === "tsiny")?.blocks.length ?? "not found"
        }
      }
    } catch (e) {
      result.BLOB_ERROR = String(e)
    }
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
