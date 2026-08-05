import { CONTACT_INFO, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo"
import { readServices } from "@/lib/services/storage"

export const revalidate = 3600

export async function GET() {
  const services = await readServices()

  const lines: string[] = []
  lines.push(`# ${SITE_NAME}`)
  lines.push("")
  lines.push(`> ${SITE_DESCRIPTION}`)
  lines.push("")
  lines.push(
    `MeTime Studio — виїзна фото- та відеознімальна команда в Черкасах, Україна (без фіксованої адреси: знімаємо на локації клієнта або орендуємо потрібну студію під запит). Контакти: ${CONTACT_INFO.phoneDisplay}, ${CONTACT_INFO.email}, Instagram @${CONTACT_INFO.instagram}.`
  )
  lines.push("")
  lines.push("## Services")
  lines.push("")
  for (const service of services) {
    lines.push(`- [${service.name}](${SITE_URL}/${service.slug}): ${service.description}`)
  }
  lines.push("")
  lines.push("## Guides")
  lines.push("")
  for (const service of services) {
    for (const topic of service.topics ?? []) {
      lines.push(`- [${topic.title}](${SITE_URL}/${service.slug}/${topic.slug}): ${topic.description}`)
    }
  }
  lines.push("")
  lines.push("## Optional")
  lines.push("")
  lines.push(`- [Portfolio](${SITE_URL}/portfolio): Client work — photo and video examples.`)
  lines.push(`- [Blog](${SITE_URL}/blog): Articles and studio updates.`)

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
