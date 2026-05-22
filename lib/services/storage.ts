import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import { get, put } from "@vercel/blob"
import type { ServiceData } from "./types"

const DATA_DIR = join(process.cwd(), "data", "services")
const SERVICES_FILE = join(DATA_DIR, "services.json")
const BLOB_KEY = "services/services.json"

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function readLocalServices(): ServiceData[] {
  if (!existsSync(SERVICES_FILE)) return []
  try {
    return JSON.parse(readFileSync(SERVICES_FILE, "utf8")) as ServiceData[]
  } catch {
    return []
  }
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const blob = await get(pathname, { access: "public", useCache: false })
    if (!blob || blob.statusCode !== 200 || !blob.stream) return null
    return (await new Response(blob.stream).json()) as T
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

// Sync read — only from local bundled file (used in generateStaticParams at build time)
export function readServicesSync(): ServiceData[] {
  return readLocalServices()
}

// Async read — Blob first (latest admin edits), falls back to local bundle
export async function readServices(): Promise<ServiceData[]> {
  if (useBlobStorage()) {
    const blob = await readBlobJson<ServiceData[]>(BLOB_KEY)
    if (blob && blob.length > 0) return blob
  }
  return readLocalServices()
}

// Write — Blob on Vercel, local file in dev
export async function saveServices(services: ServiceData[]): Promise<void> {
  if (useBlobStorage()) {
    await writeBlobJson(BLOB_KEY, services)
    return
  }
  mkdirSync(DATA_DIR, { recursive: true })
  await writeFile(SERVICES_FILE, JSON.stringify(services, null, 2), "utf8")
}

// Sync helpers for generateStaticParams (build time)
export function getServiceSync(slug: string): ServiceData | undefined {
  return readServicesSync().find((s) => s.slug === slug)
}

export function getTopicSync(serviceSlug: string, topicSlug: string) {
  const service = getServiceSync(serviceSlug)
  if (!service) return undefined
  const topic = service.topics.find((t) => t.slug === topicSlug)
  return topic ? { service, topic } : undefined
}

// Async helpers for page renders (ISR / admin) — get latest from Blob
export async function getService(slug: string): Promise<ServiceData | undefined> {
  const services = await readServices()
  return services.find((s) => s.slug === slug)
}

export async function getTopic(serviceSlug: string, topicSlug: string) {
  const service = await getService(serviceSlug)
  if (!service) return undefined
  const topic = service.topics.find((t) => t.slug === topicSlug)
  return topic ? { service, topic } : undefined
}
