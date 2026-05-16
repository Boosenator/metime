# SEO — MeTime Studio

**Домен:** https://metime.in.ua  
**Стек:** Next.js App Router · Vercel · TypeScript  
**Останнє оновлення:** 2026-05-14

---

## Статус проєкту (станом на 15.05.2026)

### Виконано ✅

| Задача | Статус | Файл | Примітка |
|---|---|---|---|
| SITE_URL → metime.in.ua | ✅ | `lib/seo.ts` | SITE_URL: "https://metime.in.ua" |
| Виправлено H1 typo: MiTime → MeTime | ✅ | `app/portfolio/page.tsx` | Коректна назва везде |
| inLanguage: ["uk-UA", "en"] → "uk-UA" | ✅ | `lib/seo.ts` | Визначена як uk-UA по всьому сайту |
| lastModified у sitemap → VERCEL_GIT_COMMIT_DATE | ✅ | `app/sitemap.ts` | Використовується VERCEL_GIT_COMMIT_DATE |
| Формат дат sitemap → YYYY-MM-DD (W3C spec) | ✅ | `app/sitemap.ts` | dateStr() повертає ISO формат |
| Keywords розширено 10 → 18 | ✅ | `lib/seo.ts` | 18 ключових слів (uk + en) |
| OG Image для портфоліо → унікальний з Blob | ✅ | `lib/seo.ts` | OG_IMAGE_PORTFOLIO: Blob URL |
| BreadcrumbList JSON-LD на /portfolio | ✅ | `app/portfolio/page.tsx` | buildBreadcrumbJsonLd() у скрипті |
| LocalBusiness JSON-LD + полна конфігурація | ✅ | `lib/seo.ts` | @id, geo, hasMap, openingHoursSpecification |
| VideoObject JSON-LD для всіх відео | ✅ | `lib/seo.ts` | buildVideoObjectJsonLd() з thumbnailUrl |
| HTTP security headers (non-static) | ✅ | `next.config.mjs` | X-Content-Type-Options, X-Frame-Options та ін. |
| images: WebP/AVIF formats | ✅ | `next.config.mjs` | formats: ["image/avif", "image/webp"] |
| next/image у мозаїці | ✅ | `components/portfolio-mosaic.tsx` | Оптимізація зображень |
| Alt-теги category-aware | ✅ | `lib/portfolio/image-src.ts` | photoAlt helper за категоріями |
| GTM підключено | ✅ | `app/layout.tsx` | GTM-N8RD2TDH ініціалізовано |
| Навігаційні якорі #portfolio → /#portfolio | ✅ | `components/navigation.tsx` | Коректні якорі в navLinks |
| Content hub: 4 сервіси + статті | ✅ | `lib/services/data.ts` | Весілля, танці, діти, бренд + love story |
| Блог: адмінка + публічні сторінки | ✅ | `app/blog/`, `app/admin/blog/` | Full CRUD + RSS |
| Sitemap 20+ URL | ✅ | `app/sitemap.ts` | Home, portfolio, blog + всі послуги/теми |
| Image Sitemap для портфоліо | ✅ | `app/image-sitemap.xml/route.ts` | Усі 170+ фото з image:caption |
| GSC верифікація | ✅ | `public/google*.html` | google0f6b16624b691c72.html |
| **Логотип href="/" (обидва місця)** | ✅ | `components/navigation.tsx` + `components/footer.tsx` | Лінія 46 (nav) + лінія 12 (footer) |
| **Copyright динамічний рік** | ✅ | `components/footer.tsx` | `new Date().getFullYear()` на лінії 34 |
| **ISR на головній** | ✅ | `app/page.tsx` | `export const revalidate = 3600` |
| **ISR на портфоліо** | ✅ | `app/portfolio/page.tsx` | `export const revalidate = 3600` |

---

## Залишилось зробити

### 🔴 Критично (ЗРОБИТИ ПЕРЕД ЗАПУСКОМ)

**1. Google Business Profile (GBP)**
**Статус:** ❌ Невідомо — потребує перевірки  
**Вплив:** +50% на локальний трафік ("фотограф Черкаси", Google Maps)  
**План дій:**
- Перевірити чи існує GBP на https://business.google.com
- Якщо НІ → Створити негайно:
  - Категорії: "Фотограф" + "Відеограф"
  - Координати: 49.4444, 32.0598 (уже у JSON-LD ✅)
  - Години: 09:00–21:00 (уже у JSON-LD ✅)
  - Фото профілю + 30+ фото портфоліо
  - Заохотити клієнтів залишати відгуки → звичайне посилання на G-Review
- Якщо ТАК → Переконатися що всі дані синхронізовані з сайтом (NAP consistency)

**2. Blog ISR замість force-dynamic** ⚡  
**Статус:** ❌ 10 файлів мають force-dynamic  
**Вплив:** Холодні старти = TTFB > 2s (погано для SEO)  
**Файли для змін:**
- `app/blog/page.tsx` — замінити на `export const revalidate = 3600`
- `app/blog/[slug]/page.tsx` — замінити на `export const revalidate = 86400` (1 день)
- `app/admin/**` — залишити force-dynamic (OK для адміна)

**Додатково:** При оновленні статті через адмінку додати `revalidatePath('/blog')`

---

### 🟠 Важливо (НАСТУПНИЙ СПРИНТ)

**3. H1 на /portfolio — SEO-оптимізований**  
**Поточний:** "Портфоліо фото та відеозйомки"  
**Проблема:** Не містить ключові слова + місто  
**Змінити на:**
```tsx
<h1 className="font-serif text-4xl font-light text-cream md:text-6xl">
  Портфоліо MeTime Studio — 170+ робіт з фото та відеозйомки в Черкасах
</h1>
```
**Файл:** `app/portfolio/page.tsx` (лінія 40)

**4. Service + Offer schema з цінами**  
**Статус:** ❌ Цін немає в JSON-LD  
**План:**
- `lib/seo.ts` → розширити `buildServiceOffersJsonLd()` з `priceCurrency` і `pricingType`
- Додати до Home page JSON-LD для 4 основних сервісів
- Приклад для wedding:
```json
{
  "@type": "Service",
  "name": "Весільна відеозйомка",
  "url": "https://metime.in.ua/wedding",
  "offers": [{
    "@type": "Offer",
    "name": "Minimal",
    "price": "6000",
    "priceCurrency": "UAH"
  }]
}
```

**5. Перевірка Alt-тегів на унікальність**  
**Статус:** ⚠️ Категорійні дублікати (~20 фото мають одинаковий alt)  
**Рішення:**
- Додати поле `caption` в `PhotoMeta` структуру (`lib/portfolio/types.ts`)
- Генерувати alt як: `"MeTime Studio — танцювальна зйомка #{photoIndex}"`
- При upload через адмінку запитувати унікальний опис

---

### 🟡 Корисно (OPTIMIZATIONS)

**6. Person schema для команди — розширити**  
**Поточний стан:** ✅ Basic Person schema є  
**Покращення:**
- Додати `image` для кожного члена команди (`public/images/team/`)
- Додати `url` з посиланням на їх Instagram/portfolio
- Додати `description` з мініпрезентацією
**Вплив:** Knowledge Panel для запитів "Андрій відеограф Черкаси"

**7. OG Image портфоліо — захистити від Blob URL**  
**Поточний:** `OG_IMAGE_PORTFOLIO` = Blob URL (небезпечно)  
**Рішення:**
- Завантажити одне репрезентативне фото як `/public/images/og-portfolio.jpg`
- Замінити `OG_IMAGE_PORTFOLIO` = `absoluteUrl("/images/og-portfolio.jpg")`
- Blob URL може піти → broken OG image у соц. мережах

**8. FAQPage schema для FAQ розділу**  
**Поточний стан:** ❌ Немає FAQPage schema  
**План:** 
- `lib/seo.ts` → добавити `buildFaqJsonLd()`
- Використати на `/blog/[slug]` сторінках де є `block.type === "faq"`
- Google може показати FAQ блок у результатах → вищий CTR

**9. VideoObject thumbnailUrl — унікальний для кожного**  
**Поточний:** Всі відео мають `thumbnailUrl: OG_IMAGE` (однакова poster.jpg)  
**Рішення:**
- Виділити перше frame кожного відео при upload
- Або використовувати репрезентативне фото з тієї ж категорії
- Вплив: Кращий вигляд у видачі + Rich Video Snippets

**10. Content hub: FAQs у текстах блогу**  
**Поточний:** Немає окремої FAQ сторінки  
**План:** Додати `/faq` сторінку з поширеними запитаннями + `@type: FAQPage`  
**Вплив:** Featured Snippet候補 для запитів типу "як вибрати фотографа"

---

### 🔵 Довгострокові СТРАТЕГІЇ

**11. EN-версія сайту з i18n routing**  
**Поточний стан:** ✅ Переклади є, але URL завжди `/`  
**Проблема:** Google індексує лише одну версію, губимо 40% органічного трафіку  
**План:** Требует рефакторинга — чекати Next.js i18n router improvements  
**Примітка:** Наразі локаль змінюється через контекст, не URL

**12. NAP консистентність у каталогах**  
**Статус:** ⚠️ Потребує перевірки  
**Name, Address, Phone** — мають бути однакові скрізь:
- Сайт (✅ `lib/seo.ts` + `lib/i18n.tsx`)
- GBP (❌ потребує перевірки)
- Prom.ua, OLX, Avvo (❌ якщо є профілі)
- Структуровані дані (✅ JSON-LD)

**Розбіжності в NAP** → Штраф від Google для локального пошуку

**13. Hreflang для майбутньої EN версії**  
**Поточний:** Відсутня  
**План:** При запуску EN версії додати:
```html
<link rel="alternate" hreflang="uk" href="https://metime.in.ua/uk/" />
<link rel="alternate" hreflang="en" href="https://metime.in.ua/en/" />
<link rel="alternate" hreflang="x-default" href="https://metime.in.ua/" />
```

**14. Schema Markup для Reviews (UserReview)**  
**План:** При рості відгуків на GBP додати schema:
```json
{
  "@type": "Review",
  "@type": "Rating",
  "ratingValue": "5",
  "bestRating": "5",
  "reviewRating": {"@type": "Rating", "ratingValue": "5"}
}
```

---

## Моніторинг 📊

| Інструмент | Метрика | Поточний стан | Як перевірити | Частота |
|---|---|---|---|---|
| **Google Search Console** | Core Web Vitals (LCP, INP, CLS) | ⚠️ Потребує перевірки | https://search.google.com/search-console → Insights | Щодня |
| | Coverage (Error/Warning) | ⚠️ | Search Console → Coverage | Після деплою |
| | CTR by query | ❓ | Performance tab → Top Queries | Щотижня |
| **PageSpeed Insights** | LCP < 2.5s | ⚠️ | https://pagespeed.web.dev → Home + Portfolio | Щомісяця |
| | INP < 200ms | ⚠️ | | |
| | CLS < 0.1 | ⚠️ | | |
| **Google Business Profile** | Visibility + Actions | ❌ Невідомо | https://business.google.com | Щотижня |
| | Reviews + Rating | ❌ | | |
| | Phone calls tracked | ❌ | | |
| **Техніка** | Sitemap + Image Sitemap | ✅ | https://metime.in.ua/sitemap.xml | Після запуску продукту |
| | robots.txt + GTM | ✅ | Перевірити у DevTools | При змінах |
| **Конкуренти** | Позиції по ключовим | ❓ | SE Ranking / Semrush | Щомісяця |
| | Backlinks | ❓ | Ahrefs / Majestic | Щомісяця |

---

## Action Plan — НАСТУПНІ КРОКИ ⚡

### 🟢 ВІДРАЗУ (На цьому спринті)

1. **GBP верифікація** — 1 день
   - Перевірити чи існує профіль на https://business.google.com
   - Якщо НІ → Створити + заповнити всі поля
   - Якщо ТАК → Синхронізувати дані з сайтом

2. **Blog ISR конверсія** — 30 хвилин
   - Замінити `force-dynamic` → `revalidate` у 2 файлах:
     - `app/blog/page.tsx` (3600s)
     - `app/blog/[slug]/page.tsx` (86400s)
   - Тест: запустити Next.js, переконатися що сторінки рендерять OK

3. **Portfolio H1 + description** — 15 хвилин
   - Оновити H1 на `/portfolio` (додати ключові слова + місто)
   - Розширити meta description (додати 170+ + категорії)

### 🟡 НАСТУПНИЙ СПРИНТ (1–2 тижні)

4. **Service Offer schema з ціни** — 1 день
   - Розширити `buildServiceOffersJsonLd()` функцію
   - Передавати `priceCurrency: "UAH"` + `pricingType: "FIXED"`
   - Тест у Google's Rich Result Tester

5. **Alt-теги унікальність** — 2–3 дні
   - Додати `caption` field у `PhotoMeta`
   - Оновити `photoAlt` helper функцію
   - Тест: перевірити alt в DevTools

6. **Verify + tune Core Web Vitals** — 1–2 дні
   - Запустити PageSpeed Insights на всіх сторінках
   - Визначити bottleneck (фото? js-bundle? fonts?)
   - Оптимізувати

### 🔵 ПОТІМ (Місяць+)

7. Добавити FAQPage schema для blog  
8. Захистити OG Image портфоліо  
9. Розширити Person schema для команди  
10. Налаштувати backlink strategy + content marketing  
11. EN версія сайту (великий рефакторинг)
