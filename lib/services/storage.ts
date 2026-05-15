import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import type { ServiceData } from "./types"

const DATA_DIR = join(process.cwd(), "data", "services")
const SERVICES_FILE = join(DATA_DIR, "services.json")

export function readServicesSync(): ServiceData[] {
  if (!existsSync(SERVICES_FILE)) return []
  try {
    return JSON.parse(readFileSync(SERVICES_FILE, "utf8")) as ServiceData[]
  } catch {
    return []
  }
}

export async function readServices(): Promise<ServiceData[]> {
  return readServicesSync()
}

export async function saveServices(services: ServiceData[]): Promise<void> {
  mkdirSync(DATA_DIR, { recursive: true })
  await writeFile(SERVICES_FILE, JSON.stringify(services, null, 2), "utf8")
}

export function getServiceSync(slug: string): ServiceData | undefined {
  return readServicesSync().find((s) => s.slug === slug)
}

export function getTopicSync(serviceSlug: string, topicSlug: string) {
  const service = getServiceSync(serviceSlug)
  if (!service) return undefined
  const topic = service.topics.find((t) => t.slug === topicSlug)
  return topic ? { service, topic } : undefined
}
