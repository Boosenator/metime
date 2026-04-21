import { NextResponse } from "next/server"
import { readPortfolioData } from "@/lib/portfolio/read-data"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"

export async function GET(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const data = await readPortfolioData()
  return NextResponse.json(data)
}
