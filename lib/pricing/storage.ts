import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import { get, put } from "@vercel/blob"
import type { PricingData } from "./types"

const DATA_DIR = join(process.cwd(), "data", "pricing")
const PRICING_JSON = join(DATA_DIR, "pricing.json")
const BLOB_PRICING_JSON = "pricing/pricing.json"

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function ensureLocalDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

function readLocalJson<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return null
  }
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const blob = await get(pathname, { access: "public" })
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null
    const response = new Response(blob.stream)
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function writeBlobJson(pathname: string, data: unknown) {
  await put(pathname, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  })
}

function normalizePricingData(data: Partial<PricingData> | null | undefined): PricingData | null {
  if (!data?.uk || !data?.en) return null

  return {
    uk: data.uk,
    en: data.en,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  }
}

export async function readPricingData(): Promise<PricingData | null> {
  const local = normalizePricingData(readLocalJson<PricingData>(PRICING_JSON))

  if (useBlobStorage()) {
    const blob = await readBlobJson<PricingData>(BLOB_PRICING_JSON)
    const normalizedBlob = normalizePricingData(blob)
    if (normalizedBlob) return normalizedBlob
  }

  return local
}

export async function savePricingData(data: PricingData) {
  const normalized = normalizePricingData(data)
  if (!normalized) {
    throw new Error("Invalid pricing data")
  }

  if (useBlobStorage()) {
    await writeBlobJson(BLOB_PRICING_JSON, normalized)
    return
  }

  ensureLocalDir()
  await writeFile(PRICING_JSON, JSON.stringify(normalized, null, 2), "utf8")
}
