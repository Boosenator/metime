import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HomeLabel, ServicesLabel } from "@/components/i18n-text"
import { I18nProvider } from "@/lib/i18n"
import { readServicesSync, getServiceSync as getService } from "@/lib/services/storage"
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildServiceJsonLd,
  SITE_NAME,
  OG_IMAGE,
} from "@/lib/seo"
import type { FaqItem } from "@/lib/services/types"

type LandingContent = {
  heading: string
  paragraphs: string[]
  formats: string[]
  related: { text: string; href: string }[]
  faq: FaqItem[]
}

const LANDING_CONTENT: Record<string, LandingContent> = {
  wedding: {
    heading: "Весільна фото- та відеозйомка без хаосу в день події",
    paragraphs: [
      "Весілля складно повторити, тому зйомка має бути не випадковою, а продуманою: таймінг, локації, світло, ключові моменти церемонії, портрети пари, гості, перший танець і атмосфера вечора. Ми допомагаємо спланувати зйомку так, щоб у день весілля ви не думали про камеру, а просто проживали подію.",
      "MeTime Studio працює з камерними весіллями, повними весільними днями, love story, церемоніями та форматами фото + відео. Якщо потрібна тільки коротка присутність на церемонії, можна обрати погодинний формат. Якщо важливо зберегти весь день, краще планувати повну зміну або full day.",
    ],
    formats: [
      "відеозйомка церемонії та ключових моментів дня",
      "короткий весільний кліп для соцмереж і родини",
      "повне весільне відео з церемонією, привітаннями і святкуванням",
      "love story або передвесільна зйомка",
      "комбінований формат фото + відео однією командою",
    ],
    related: [
      { text: "Скільки коштує весільна зйомка в Черкасах", href: "/wedding/vartist" },
      { text: "Як вибрати весільного фотографа", href: "/wedding/yak-obraty-fotohrafa" },
      { text: "Подивитися портфоліо", href: "/portfolio" },
      { text: "Перейти до цін", href: "/#pricing" },
    ],
    faq: [
      {
        q: "Скільки годин весільної зйомки потрібно?",
        a: "Для церемонії та короткої прогулянки часто достатньо 3-5 годин. Для повного весільного дня краще планувати 8-14 годин, щоб зберегти збори, церемонію, гостей і вечір.",
      },
      {
        q: "Можна замовити тільки відео або тільки фото?",
        a: "Так. Можна замовити окремо фото, окремо відео або комбінований формат фото + відео однією командою.",
      },
      {
        q: "Чи допомагаєте з таймінгом весільного дня?",
        a: "Так. Ми підказуємо, скільки часу закласти на церемонію, прогулянку, портрети, сімейні кадри і технічні паузи.",
      },
    ],
  },
  dance: {
    heading: "Танцювальна зйомка для студій, команд і сольних номерів",
    paragraphs: [
      "Танець важливо знімати не як звичайний портрет, а як рух: ритм, амплітуда, синхрон, лінії тіла, емоції і характер постановки. Для цього потрібні правильний момент, ракурс, світло і розуміння жанру.",
      "Ми знімаємо сольні номери, групові постановки, dance контент для Instagram і TikTok, відео для танцювальних шкіл, pole dance, heels, hip-hop, contemporary, dancehall та інші напрями. Формат можна підібрати під задачу: від швидкої Group Session до повноцінного кліпу з монтажем.",
    ],
    formats: [
      "Group Session для груп від 3 людей",
      "відеозйомка готової хореографії",
      "контент для Reels, TikTok і Instagram",
      "зйомка pole dance, heels, exotic, contemporary, hip-hop",
      "танцювальна фотосесія для портфоліо",
    ],
    related: [
      { text: "Group Session від MeTime", href: "/dance/grupova-videozyomka-tantsyu" },
      { text: "Pole Dance відеозйомка в Черкасах", href: "/dance/videozyomka-pole-dance" },
      { text: "Reels і TikTok для танцювальної студії", href: "/dance/reels-tiktok-dlya-tantsiv" },
      { text: "Як підготуватися до танцювальної фотосесії", href: "/dance/pidhotovka" },
      { text: "Стилі танцювальної зйомки", href: "/dance/styli" },
      { text: "Перейти до цін", href: "/#pricing" },
    ],
    faq: [
      {
        q: "Чи можна зняти танець для Reels або TikTok?",
        a: "Так. Ми можемо знімати з урахуванням вертикального формату, динаміки і коротких фрагментів для соцмереж.",
      },
      {
        q: "Чи підходить зйомка для pole dance або heels?",
        a: "Так. Для таких напрямів окремо проговорюємо локацію, світло, ракурси, безпеку трюків і межі комфорту.",
      },
      {
        q: "Скільки людей потрібно для Group Session?",
        a: "Мінімум 3 учасники. Такий формат зручний, коли група хоче розділити бюджет і отримати відео готової хореографії.",
      },
    ],
  },
  kids: {
    heading: "Дитяча та сімейна зйомка без постановочного напруження",
    paragraphs: [
      "Діти рідко поводяться за сценарієм, і саме в цьому цінність дитячої зйомки. Ми не змушуємо дитину довго позувати, а працюємо через гру, спостереження і короткі живі моменти.",
      "Знімаємо дні народження, хрестини, gender party, сімейні прогулянки, новонароджених і дитячі портрети. Для кожного віку потрібен свій темп: немовлятам - спокій і тепло, малюкам - гра, старшим дітям - простір для характеру.",
    ],
    formats: [
      "відеозйомка дня народження",
      "хрестини в церкві та сімейні моменти після церемонії",
      "gender party і момент відкриття статі дитини",
      "newborn-зйомка у перші дні життя",
      "сімейна фотосесія з дітьми",
    ],
    related: [
      { text: "Як підготуватись до дитячої фотосесії", href: "/kids/pidhotovka" },
      { text: "Newborn-зйомка: коли бронювати", href: "/kids/newborn" },
      { text: "Подивитися портфоліо", href: "/portfolio" },
      { text: "Перейти до цін", href: "/#pricing" },
    ],
    faq: [
      {
        q: "Що робити, якщо дитина не хоче фотографуватись?",
        a: "Це нормально. Ми не тиснемо, а даємо дитині час звикнути, переключаємось на гру і ловимо природні моменти.",
      },
      {
        q: "Скільки триває дитяча зйомка?",
        a: "Залежить від формату. Для події зазвичай планують 2-3 години, для спокійної сімейної фотосесії часто достатньо коротшої зустрічі.",
      },
      {
        q: "Чи можна знімати вдома?",
        a: "Так. Для newborn і камерних сімейних історій домашня локація часто найкомфортніша.",
      },
    ],
  },
  brand: {
    heading: "Бренд-зйомка для бізнесу, експертів і соцмереж",
    paragraphs: [
      "Бізнесу потрібні не просто красиві кадри, а матеріал, який пояснює продукт, показує людей, процес, атмосферу і довіру. Бренд-зйомка допомагає зробити сайт, Instagram, TikTok, LinkedIn або презентацію живішими і зрозумілішими.",
      "Ми знімаємо контент для експертів, локальних бізнесів, салонів, магазинів, курсів, особистих брендів і команд. Перед зйомкою важливо зрозуміти, де матеріал буде використовуватись: у Reels, на сайті, в рекламі, в сторіс або в навчальному продукті.",
    ],
    formats: [
      "контент для Instagram, TikTok і Reels",
      "відео про продукт або послугу",
      "behind the scenes і процес роботи",
      "портрети експерта або команди",
      "зйомка навчального курсу чи майстер-класу",
    ],
    related: [
      { text: "Контент-зйомка для Instagram і соцмереж", href: "/brand/dlya-soczmerezh" },
      { text: "Як підготуватись до бренд-зйомки", href: "/brand/pidhotovka" },
      { text: "Подивитися портфоліо", href: "/portfolio" },
      { text: "Перейти до цін", href: "/#pricing" },
    ],
    faq: [
      {
        q: "Що підготувати перед бренд-зйомкою?",
        a: "Варто підготувати цілі зйомки, список потрібних кадрів, референси, продукти, локацію, образи і розуміння, де буде використовуватись контент.",
      },
      {
        q: "Чи можна за одну зйомку отримати фото і відео для різних соцмереж?",
        a: "Так. Ми можемо одразу планувати горизонтальні, вертикальні і портретні кадри під сайт, Instagram, TikTok, Reels і презентації.",
      },
      {
        q: "Чи підходить бренд-зйомка для малого бізнесу?",
        a: "Так. Для малого бізнесу це часто найшвидший спосіб отримати живий контент для продажів, довіри і регулярної комунікації.",
      },
    ],
  },
}

export function generateStaticParams() {
  return readServicesSync().map((s) => ({ service: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service: slug } = await params
  const service = getService(slug)
  if (!service) return {}

  return {
    title: service.title,
    description: service.description,
    keywords: service.keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${service.title} | ${SITE_NAME}`,
      description: service.description,
      url: absoluteUrl(`/${slug}`),
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: service.name }],
    },
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service: slug } = await params
  const service = getService(slug)
  if (!service) notFound()
  const landingContent = LANDING_CONTENT[slug]
  const services = readServicesSync()

  return (
    <I18nProvider>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            buildServiceJsonLd(service),
            buildBreadcrumbJsonLd([
              { name: "Головна", url: "/" },
              { name: service.name, url: `/${slug}` },
            ]),
            ...(landingContent ? [buildFaqJsonLd(landingContent.faq)] : []),
          ]),
        }}
      />
      <Navigation />
      <main className="page-main">
        {/* Hero */}
        <div className="article-container">
          <nav aria-label="Breadcrumb" className="breadcrumb-nav">
            <ol className="breadcrumb-list">
              <li><a href="/" className="transition-colors hover:text-cream"><HomeLabel /></a></li>
              <li aria-hidden="true" className="text-white/20">/</li>
              <li className="text-cream">{service.name}</li>
            </ol>
          </nav>

          <div className="page-hero">
            <p className="page-eyebrow"><ServicesLabel /></p>
            <h1 className="page-title mb-6">
              {service.name}
            </h1>
            <div className="max-w-2xl space-y-4 text-base leading-relaxed text-gray-light md:text-lg">
              {service.intro.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="page-container">
          {landingContent ? (
            <section className="mb-20">
              <div className="mb-10 max-w-3xl">
                <p className="mb-4 text-xs uppercase tracking-[0.3em] text-wine">
                  Формати зйомки
                </p>
                <h2 className="mb-6 font-serif text-3xl font-light leading-tight text-cream md:text-4xl">
                  {landingContent.heading}
                </h2>
                <div className="space-y-5 text-base leading-[1.85] text-gray-light">
                  {landingContent.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
                <div className="border border-white/10 p-6 md:p-8">
                  <h3 className="mb-5 text-xs uppercase tracking-[0.25em] text-wine">
                    Що можна зняти
                  </h3>
                  <ul className="space-y-3">
                    {landingContent.formats.map((item) => (
                      <li key={item} className="flex items-start gap-4 text-gray-light">
                        <span className="mt-[0.65em] h-px w-5 shrink-0 bg-wine" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-wine/20 bg-dark-card p-6 md:p-8">
                  <h3 className="mb-5 text-xs uppercase tracking-[0.25em] text-wine">
                    Корисні переходи
                  </h3>
                  <ul className="space-y-3">
                    {landingContent.related.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="text-sm text-cream underline underline-offset-4 transition-colors hover:text-wine"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-12">
                <h2 className="mb-6 font-serif text-2xl font-light text-cream md:text-3xl">
                  Часті питання
                </h2>
                <div className="space-y-3">
                  {landingContent.faq.map((item) => (
                    <details
                      key={item.q}
                      className="group border border-white/10 transition-colors open:border-wine/30"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5">
                        <span className="font-serif text-lg font-light text-cream">
                          {item.q}
                        </span>
                        <span className="mt-1 shrink-0 text-xl leading-none text-wine transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="border-t border-white/8 px-6 py-5 leading-relaxed text-gray-light">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* Topics grid */}
          <section aria-labelledby="topics-heading" className="mb-20">
            <p
              id="topics-heading"
              className="mb-8 text-xs uppercase tracking-[0.3em] text-wine"
            >
              Корисні матеріали
            </p>
            <div className="content-grid md:grid-cols-3">
              {service.topics.map((topic) => (
                <a
                  key={topic.slug}
                  href={`/${slug}/${topic.slug}`}
                  className="group content-card"
                >
                  <h2 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine">
                    {topic.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-mid">
                    {topic.description}
                  </p>
                  <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Читати →
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="cta-panel">
            <p className="mb-6 font-serif text-3xl font-light text-cream">
              Хочете поговорити про вашу зйомку?
            </p>
            <p className="mb-8 text-gray-light">
              Розкажіть нам про вашу ідею — ми підберемо формат і відповімо на всі питання.
            </p>
            <a
              href="/#contact"
              className="outline-cta px-10"
            >
              Написати нам
            </a>
          </div>
        </div>
      </main>
      <Footer services={services} />
    </I18nProvider>
  )
}
