import { writeFile } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import type { LayoutData } from "@/lib/portfolio/types"

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const payload = body as Partial<LayoutData>
  if (
    typeof payload.grid?.cols !== "number" ||
    typeof payload.grid?.rows !== "number" ||
    !Array.isArray(payload.cells)
  ) {
    return NextResponse.json({ error: "Invalid layout payload" }, { status: 400 })
  }

  const validated: LayoutData = {
    grid: {
      cols: Math.max(1, Math.min(40, Math.floor(payload.grid.cols))),
      rows: Math.max(1, Math.min(40, Math.floor(payload.grid.rows))),
    },
    cells: payload.cells
      .filter(
        (c) =>
          c &&
          typeof c.photoId === "string" &&
          typeof c.x === "number" &&
          typeof c.y === "number" &&
          typeof c.spanX === "number" &&
          typeof c.spanY === "number"
      )
      .map((c) => ({
        photoId: c.photoId,
        x: Math.max(0, Math.floor(c.x)),
        y: Math.max(0, Math.floor(c.y)),
        spanX: Math.max(1, Math.floor(c.spanX)),
        spanY: Math.max(1, Math.floor(c.spanY)),
      })),
    version: typeof payload.version === "number" ? payload.version + 1 : 1,
    updatedAt: new Date().toISOString(),
  }

  const path = join(process.cwd(), "data", "portfolio", "layout.json")
  await writeFile(path, JSON.stringify(validated, null, 2), "utf8")

  return NextResponse.json({ ok: true, cells: validated.cells.length })
}
