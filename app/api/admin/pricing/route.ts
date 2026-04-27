import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"
import { savePricingData } from "@/lib/pricing/storage"
import type { PricingCustomCategory, PricingData, PricingLocaleData, PricingPackageItem, PricingStandardCategory } from "@/lib/pricing/types"

function normalizePackageItem(item: Partial<PricingPackageItem>, fallbackId: string): PricingPackageItem {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : fallbackId,
    name: typeof item.name === "string" ? item.name : "",
    price: typeof item.price === "string" ? item.price : item.price === null ? null : "",
    features: Array.isArray(item.features) ? item.features.filter((feature): feature is string => typeof feature === "string") : [],
  }
}

function normalizeStandardCategory(category: Partial<PricingStandardCategory> | undefined, prefix: string): PricingStandardCategory {
  return {
    title: typeof category?.title === "string" ? category.title : "",
    packages: Array.isArray(category?.packages)
      ? category.packages.map((item, index) => normalizePackageItem(item, `${prefix}-${index + 1}`))
      : [],
    extras: Array.isArray(category?.extras) ? category.extras.filter((item): item is string => typeof item === "string") : [],
  }
}

function normalizeCustomCategory(category: Partial<PricingCustomCategory> | undefined): PricingCustomCategory {
  return {
    title: typeof category?.title === "string" ? category.title : "",
    subtitle: typeof category?.subtitle === "string" ? category.subtitle : "",
    description: typeof category?.description === "string" ? category.description : "",
    features: Array.isArray(category?.features) ? category.features.filter((item): item is string => typeof item === "string") : [],
    cta: typeof category?.cta === "string" ? category.cta : "",
  }
}

function normalizeLocaleData(data: Partial<PricingLocaleData> | undefined): PricingLocaleData {
  return {
    dance: normalizeStandardCategory(data?.dance, "dance"),
    wedding: normalizeStandardCategory(data?.wedding, "wedding"),
    kids: normalizeStandardCategory(data?.kids, "kids"),
    brand: normalizeStandardCategory(data?.brand, "brand"),
    custom: normalizeCustomCategory(data?.custom),
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  let body: Partial<PricingData>
  try {
    body = (await request.json()) as Partial<PricingData>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid pricing payload" }, { status: 400 })
  }

  const normalized: PricingData = {
    uk: normalizeLocaleData(body.uk),
    en: normalizeLocaleData(body.en),
    updatedAt: new Date().toISOString(),
  }

  try {
    await savePricingData(normalized)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to save pricing data", error)
    return NextResponse.json({ error: "Failed to save pricing data" }, { status: 500 })
  }
}
