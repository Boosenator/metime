import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import { list, put } from "@vercel/blob"
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
    const { blobs } = await list({ prefix: pathname })
    const blob = blobs.find((b) => b.pathname === pathname)
    if (!blob) return null
    const res = await fetch(blob.url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as T
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
    if (blob && blob.length > 0) {
      console.log("[services/storage] readServices: source=BLOB")
      return blob
    }
    console.log("[services/storage] readServices: blob null/empty, falling back to local")
  }
  console.log("[services/storage] readServices: source=LOCAL")
  return readLocalServices()
}

// Read strictly from Blob — returns null if unavailable (no local fallback).
// Used by PUT routes to prevent accidentally overwriting Blob with stale local data.
export async function readServicesFromBlob(): Promise<ServiceData[] | null> {
  if (!useBlobStorage()) return null
  return readBlobJson<ServiceData[]>(BLOB_KEY)
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
  const topic = service?.topics.find((t) => t.slug === topicSlug)
  if (service && topic) return { service, topic }

  // Production may have older admin-edited Blob data than the bundled JSON.
  // Keep new code-shipped topics reachable even before Blob is refreshed.
  return getTopicSync(serviceSlug, topicSlug)
}
