# SEO Plan — MeTime Studio

**Аудит проведено:** 2026-05-12  
**Сайт:** https://metime.in.ua  
**Стек:** Next.js 13+ App Router, Vercel, TypeScript

---

## Поточний стан

### Що вже реалізовано

| Елемент | Файл | Статус |
|---|---|---|
| Централізований SEO конфіг | `lib/seo.ts` | ✅ |
| Metadata API (Next.js) | `app/layout.tsx`, `app/*/page.tsx` | ✅ |
| Open Graph теги | усі публічні сторінки | ✅ |
| Twitter Cards | усі публічні сторінки | ✅ |
| JSON-LD: LocalBusiness | `app/page.tsx` | ✅ |
| JSON-LD: WebSite | `app/page.tsx` | ✅ |
| JSON-LD: CollectionPage | `app/portfolio/page.tsx` | ✅ |
| Canonical URLs | усі публічні сторінки | ✅ |
| robots.txt (динамічний) | `app/robots.ts` | ✅ |
| sitemap.xml (динамічний) | `app/sitemap.ts` | ✅ |
| Alt-теги на зображеннях | компоненти | ✅ |
| Font display:swap | `app/layout.tsx` | ✅ |
| Favicon / Apple icon | `app/layout.tsx` | ✅ |
| Web App Manifest | `app/manifest.ts` | ✅ |
| Google Search Console | `public/google*.html` | ✅ |
| Admin noindex | `app/admin/*/page.tsx` | ✅ |

---

## Задачі по пріоритету

---

### 🔴 Критично (виправити негайно)

#### 1. Опечатка в H1 на сторінці портфоліо

**Файл:** `app/portfolio/page.tsx:59`  
**Проблема:** `MiTime Studio` замість `MeTime Studio`  
**Вплив:** H1 — найважливіший заголовок для SEO. Некоректна назва бренду шкодить.  
**Виправлення:** Замінити рядок.

```diff
- <h1 className="font-serif text-4xl font-light text-cream md:text-6xl">MiTime Studio</h1>
+ <h1 className="font-serif text-4xl font-light text-cream md:text-6xl">MeTime Studio</h1>
```

---

#### 2. `inLanguage` у WebSite JSON-LD заявляє неіснуючу мову

**Файл:** `lib/seo.ts:124`  
**Проблема:** `inLanguage: ["uk-UA", "en"]` — англійська версія не існує. Google може вважати сайт двомовним і шукати `hreflang` теги, яких немає.  
**Вплив:** Плутанина для краулерів, потенційна втрата релевантності.  
**Виправлення:**

```diff
- inLanguage: ["uk-UA", "en"],
+ inLanguage: "uk-UA",
```

---

### 🟠 Важливо (зробити найближчим часом)

#### 3. `lastModified` у sitemap завжди рівний поточному часу

**Файл:** `app/sitemap.ts`  
**Проблема:** `lastModified: new Date()` — дата змінюється при кожному запиті. Google може ігнорувати або знецінити сигнал свіжості.  
**Виправлення:** Використати реальну дату останнього деплою або статичну дату релізу.

```ts
// Варіант 1: дата з env (встановлюється при деплої на Vercel)
const deployDate = process.env.VERCEL_GIT_COMMIT_DATE
  ? new Date(process.env.VERCEL_GIT_COMMIT_DATE)
  : new Date("2025-01-01")

// Варіант 2: статична дата останнього значного оновлення контенту
const LAST_UPDATED = new Date("2025-04-01")
```

---

#### 4. Розширити список ключових слів

**Файл:** `lib/seo.ts:36-47`  
**Проблема:** Зараз 10 ключових слів. Відсутні важливі категорії зйомок, які реально надаються.  
**Виправлення:** Додати:

```ts
"танцювальна зйомка Черкаси",
"дитяча зйомка Черкаси",
"сімейна фотосесія Черкаси",
"dance photography Ukraine",
"відеограф Черкаська область",
"весільне відео Черкаси",
"бранч зйомка",
"studio photography Cherkasy",
```

---

#### 5. Унікальне OG-зображення для сторінки портфоліо

**Файли:** `lib/seo.ts:11`, `app/portfolio/page.tsx:19`  
**Проблема:** Обидві сторінки використовують `hero.jpg`. При репості посилання на портфоліо у соцмережах відображається однакова картинка.  
**Виправлення:**
1. Підготувати зображення `public/images/og-portfolio.jpg` (1200×630) — колаж із портфоліо
2. Додати константу в `lib/seo.ts`:
   ```ts
   export const OG_IMAGE_PORTFOLIO = "/images/og-portfolio.jpg"
   ```
3. Використати в `app/portfolio/page.tsx`

---

#### 6. Додати `twitter:site` handle

**Файл:** `lib/seo.ts:71-76`  
**Проблема:** Відсутній `twitter.creator` / `twitter.site`. Twitter/X використовує це для атрибуції.  
**Виправлення** (якщо є Twitter/X акаунт):

```ts
twitter: {
  card: "summary_large_image",
  site: "@metime_ck",     // або реальний Twitter handle
  creator: "@metime_ck",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  images: [OG_IMAGE],
},
```

---

### 🟡 Корисно (зробити при можливості)

#### 7. BreadcrumbList JSON-LD на сторінці портфоліо

**Файл:** `app/portfolio/page.tsx` + `lib/seo.ts`  
**Навіщо:** Google відображає хлібні крихти прямо в пошуковій видачі → вищий CTR.  
**Реалізація:** Додати функцію `buildBreadcrumbJsonLd()` у `lib/seo.ts`:

```ts
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}
```

Використання на `/portfolio`:
```ts
buildBreadcrumbJsonLd([
  { name: "Головна", url: "/" },
  { name: "Портфоліо", url: "/portfolio" },
])
```

---

#### 8. Розширити JSON-LD LocalBusiness

**Файл:** `lib/seo.ts:97-116`  
**Що додати:**

```ts
// Години роботи (якщо актуально)
openingHoursSpecification: [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "09:00",
    closes: "21:00",
  },
],
// Додаткові соцмережі у sameAs
sameAs: [
  CONTACT_INFO.instagramUrl,
  // "https://facebook.com/metime_ck",  // якщо є
  // "https://www.youtube.com/@metime",  // якщо є
],
// Послуги
hasOfferCatalog: {
  "@type": "OfferCatalog",
  name: "Послуги фото та відеозйомки",
  itemListElement: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Весільна зйомка" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Love story" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Танцювальна зйомка" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Бренд-зйомка" } },
  ],
},
```

---

#### 9. Оптимізація зображень

**Файл:** `next.config.mjs:13`  
**Проблема:** `images: { unoptimized: true }` — Next.js не конвертує в WebP/AVIF, не стискає, не resize. Впливає на LCP.  
**Застереження:** Якщо сайт деплоїться як статичний (`output: "export"`), оптимізація зображень Next.js не працює без сервера.  
**Варіанти вирішення:**
- Якщо деплой на Vercel як SSR (без `STATIC_EXPORT=true`) → прибрати `unoptimized: true`
- Якщо статичний деплой → оптимізувати зображення вручну перед завантаженням (squoosh, sharp скрипт)
- Або підключити Cloudinary / Imgix для трансформацій

---

#### 10. HTTP заголовки для SEO та безпеки

**Файл:** `next.config.mjs`  
**Навіщо:** Cache-Control та security headers впливають на трастовість і швидкість.

```js
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "origin-when-cross-origin" },
      ],
    },
    {
      source: "/images/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ]
},
```

**Застереження:** Не працює при `output: "export"` (статичний деплой).

---

#### 11. Покращити alt-теги на портфоліо фото

**Файли:** `components/portfolio-mosaic.tsx`, `components/portfolio-client.tsx`  
**Проблема:** Alt-текст рівний `photo.filename` (наприклад `DSC_0042.jpg`) — не інформативний.  
**Виправлення:** Якщо фото мають категорію або опис у `data/` — використати їх. Або додати поле `altText` до моделі фото.

Приклад:
```ts
alt={photo.altText ?? `${SITE_NAME} — ${photo.category ?? "фотографія"}`}
```

---

### 🔵 Моніторинг (налаштувати та регулярно перевіряти)

#### 12. Google Search Console

- Перевірити що верифікація активна (`public/google*.html` є)
- Подати sitemap вручну: `https://metime.in.ua/sitemap.xml`
- Слідкувати за: Coverage → індексація, Core Web Vitals, Search results → CTR

#### 13. Core Web Vitals цілі

| Метрика | Ціль |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

Інструменти: PageSpeed Insights, Vercel Speed Insights.

---

## Зведений план виконання

| Пріоритет | Задача | Файл | Час |
|---|---|---|---|
| 🔴 | Виправити опечатку h1 | `app/portfolio/page.tsx` | 2 хв |
| 🔴 | Виправити `inLanguage` | `lib/seo.ts` | 2 хв |
| 🟠 | Виправити `lastModified` у sitemap | `app/sitemap.ts` | 15 хв |
| 🟠 | Розширити keywords | `lib/seo.ts` | 10 хв |
| 🟠 | OG зображення для портфоліо | `lib/seo.ts` + `app/portfolio/page.tsx` | 30 хв + підготовка зображення |
| 🟠 | Додати `twitter:site` | `lib/seo.ts` | 5 хв |
| 🟡 | BreadcrumbList JSON-LD | `lib/seo.ts` + `app/portfolio/page.tsx` | 20 хв |
| 🟡 | Розширити LocalBusiness JSON-LD | `lib/seo.ts` | 20 хв |
| 🟡 | Оптимізація зображень | `next.config.mjs` | 1-2 год |
| 🟡 | HTTP заголовки | `next.config.mjs` | 30 хв |
| 🟡 | Покращити alt-теги | компоненти портфоліо | 30 хв |
| 🔵 | Подати sitemap у GSC | Google Search Console | 5 хв |
| 🔵 | Налаштувати моніторинг CWV | Vercel / GSC | 15 хв |
