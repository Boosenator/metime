# SEO — MeTime Studio

**Домен:** https://metime.in.ua  
**Стек:** Next.js App Router · Vercel · TypeScript  
**Останнє оновлення:** 2026-05-14

---

## Виконано ✅

| Задача | Файл |
|---|---|
| SITE_URL → metime.in.ua | `lib/seo.ts` |
| Виправлено H1 typo: MiTime → MeTime | `app/portfolio/page.tsx` |
| inLanguage: ["uk-UA", "en"] → "uk-UA" | `lib/seo.ts` |
| lastModified у sitemap → VERCEL_GIT_COMMIT_DATE | `app/sitemap.ts` |
| Формат дат sitemap → YYYY-MM-DD (W3C spec) | `app/sitemap.ts` |
| Keywords розширено 10 → 18 | `lib/seo.ts` |
| OG Image для портфоліо → унікальний з Blob | `lib/seo.ts` |
| BreadcrumbList JSON-LD на /portfolio та /blog | сторінки |
| LocalBusiness JSON-LD + hasOfferCatalog (6 послуг) | `lib/seo.ts` |
| VideoObject JSON-LD для відео | `lib/seo.ts` |
| buildServiceJsonLd + buildArticleJsonLd | `lib/seo.ts` |
| HTTP security headers (non-static) | `next.config.mjs` |
| images: unoptimized → isStatic + WebP/AVIF formats | `next.config.mjs` |
| next/image у мозаїці + blur → dominantColor div | `components/portfolio-mosaic.tsx` |
| Alt-теги → category-aware (photoAlt helper) | `lib/portfolio/image-src.ts` |
| GTM підключено (GTM-N8RD2TDH) | `app/layout.tsx` |
| Навігаційні якорі #portfolio → /#portfolio | `components/navigation.tsx` |
| Content hub: 4 сервіси + 12 статей | `lib/services/data.ts` |
| Блог: адмінка + публічні сторінки | `app/blog/`, `app/admin/blog/` |
| Sitemap розширено до 15+ URL | `app/sitemap.ts` |
| GSC верифікація | `public/google*.html` |

---

## Залишилось зробити

### 🔴 Критично

**1. Google Business Profile**
Найбільший вплив на локальний пошук ("фотограф Черкаси" в Google Maps / Local Pack). Якщо не створений — зробити зараз.
- Категорії: "Фотограф" + "Відеограф" + "Студія відеозйомки"
- URL сайту: https://metime.in.ua
- Реальні координати (49.4444, 32.0598)
- Години роботи
- Фото профілю і портфоліо
- Стимулювати клієнтів залишати відгуки

**2. Логотип `href="#"` → `href="/"`**
Файли: `components/navigation.tsx`, `components/footer.tsx`
Логотип — найсильніше внутрішнє посилання на головну. З `#` PageRank не передається.

---

### 🟠 Важливо

**3. LocalBusiness JSON-LD — додати критичні поля**
Файл: `lib/seo.ts` → `buildStudioJsonLd()`

```ts
"@id": `${SITE_URL}/#studio`,
geo: {
  "@type": "GeoCoordinates",
  latitude: 49.4444,
  longitude: 32.0598,
},
logo: {
  "@type": "ImageObject",
  url: absoluteUrl("/icon.svg"),
},
hasMap: "https://maps.google.com/?q=MeTime+Studio+Cherkasy",
openingHoursSpecification: [{
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  opens: "09:00",
  closes: "21:00",
}],
```

**4. ISR замість `force-dynamic`**
Файли: `app/page.tsx`, `app/portfolio/page.tsx`
Кожен запит — повний SSR з читанням Blob. Холодні старти = повільний TTFB.

```ts
// замінити:
export const dynamic = "force-dynamic"
// на:
export const revalidate = 3600
```
При збереженні через адмінку — тригерити `revalidatePath('/')`.

**5. H1 на `/portfolio` — без ключових слів**
Файл: `app/portfolio/page.tsx`
Поточний H1: `"MeTime Studio"` — назва бренду, не пошуковий запит.

```tsx
// замінити на:
<h1>Портфоліо MeTime Studio — фото та відеозйомка в Черкасах</h1>
```

**6. Meta description портфоліо — без міста і кількості**
Файл: `app/portfolio/page.tsx`

```ts
// замінити на:
description: "Портфоліо MeTime Studio — 170+ робіт з весільної, танцювальної, дитячої та бренд-зйомки у Черкасах."
```

**7. Image Sitemap для фото портфоліо**
170 зображень з Blob не індексуються через Image Search. Google Images — окремий трафік для фотостудії.
Реалізація: `app/image-sitemap.xml/route.ts` з усіма фото URLs та alt текстами з `photos.json`.

**8. Copyright → динамічний рік**
Файл: `lib/i18n.tsx`
Зараз: `"© 2025 MeTime."` — вже застаріло.

```tsx
{`© ${new Date().getFullYear()} MeTime. `}
```

---

### 🟡 Корисно

**9. Service + Offer schema з цінами**
Прайс-лист є в `lib/i18n.tsx`. Додавання `Offer` з `priceSpecification` може дати цінові rich snippets у видачі.

```json
{
  "@type": "Service",
  "name": "Весільна відеозйомка",
  "offers": [
    { "@type": "Offer", "name": "Minimal", "price": "6000", "priceCurrency": "UAH" }
  ]
}
```

**10. Person schema для команди**
Андрій, Нікіта, Анна, Ігор є в i18n. `Person` schema з `jobTitle` + `worksFor` покращує Knowledge Panel для запитів типу "відеограф Черкаси Андрій".

**11. VideoObject thumbnailUrl — унікальний для кожного відео**
Файл: `lib/seo.ts` → `buildVideoObjectJsonLd()`
Зараз всі відео мають `thumbnailUrl: OG_IMAGE` (hero.jpg). Google очікує унікальне зображення.
Мінімум — передавати категорійне фото з `photos.json` за категорією відео.

**12. Hero subtitle: англійський текст на українській сторінці**
Файл: `lib/i18n.tsx:109`
`"Photo & Video Production Studio"` — EN текст на UK сторінці. Для ботів байдуже, але для UX варто перекласти.

**13. Alt-теги — унікальні замість категорійних дублікатів**
Файл: `lib/portfolio/image-src.ts`
Зараз ~20 фото мають однаковий alt `"MeTime Studio — танцювальна зйомка"`.
Мінімум: `"MeTime Studio — танцювальна зйомка №12"`.
Ідеально: додати поле `caption` у `PhotoMeta` і заповнювати при upload через адмінку.

**14. OG Image портфоліо — захистити від зміни Blob URL**
Файл: `lib/seo.ts`
Поточний `OG_IMAGE_PORTFOLIO` — зовнішній Blob URL. Якщо storage переїде — broken image у всіх шерах.
Краще: завантажити як `/public/images/og-portfolio.jpg` і використовувати локальний шлях.

---

### 🔵 Довгострокові

**15. EN-версія сайту з i18n routing**
Переклади є (`SITE_DESCRIPTION_EN`), але URL завжди `/` — Google індексує тільки одну версію.
Потребує Next.js i18n routing: `/uk/` і `/en/` з hreflang тегами. Великий рефакторинг.

**16. FAQPage schema**
Секція "Не знайшов ідеальний пакет?" і питання у статтях блогу — натуральні FAQ.
Google може показати FAQ блок у результатах → вищий CTR без росту позицій.

**17. NAP консистентність у каталогах**
Name, Address, Phone — однаковий скрізь: сайт, GBP, Prom.ua, OLX, будь-які каталоги.
Розбіжності у NAP негативно впливають на локальний пошук.

---

## Моніторинг

| Інструмент | Що перевіряти | Частота |
|---|---|---|
| Google Search Console | Coverage, Core Web Vitals, CTR по запитах | Щотижня |
| PageSpeed Insights | LCP < 2.5s, INP < 200ms, CLS < 0.1 | Щомісяця |
| Google Business Profile | Відгуки, перегляди, дзвінки | Щотижня |
| Sitemap | https://metime.in.ua/sitemap.xml | Після деплоїв |

---

## Наступні пріоритети одним рядком

**Зробити зараз:** логотип href="/" + LocalBusiness geo/id + ISR замість force-dynamic + H1 портфоліо + meta description портфоліо + copyright динамічний + GBP (якщо не зроблено).
