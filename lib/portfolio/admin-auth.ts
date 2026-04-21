import { NextResponse } from "next/server"

export function requireAdminAuth(request: Request): Response | null {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return null

  const auth = request.headers.get("x-admin-password")
  if (auth !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
