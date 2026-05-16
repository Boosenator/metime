# SEO аудит - MeTime Studio

**Дата повторного аудиту:** 2026-05-16
**Роль:** Head of SEO
**Домен:** https://metime.in.ua
**Стек:** Next.js App Router, Vercel, Supabase/Vercel Blob, TypeScript
**Статус документа:** основне джерело правди для SEO-плану. Старий `docs/seo-plan.md` залишений як архівне посилання.

## Executive Summary

Сайт уже має сильну технічну базу: canonical, robots, sitemap, image sitemap, LocalBusiness, Service, Article, Breadcrumb і FAQ schema присутні в коді. Після останніх змін з'явились двомовний редактор блогу, переклади для сервісних матеріалів і публічні сторінки послуг/статей.

Головний SEO-ризик зараз не в стилях чи schema, а в мовній архітектурі: англійський контент може показуватись через cookie/localStorage на тих самих URL, що й український. Для Google це не повноцінна EN-версія, бо немає окремих URL, `hreflang`, localized sitemap і locale-aware JSON-LD. Поки це не виправлено, англійську версію краще вважати UX-функцією, а не SEO-активом.

Другий пріоритет - локальний пошук: Google Business Profile, NAP consistency, портфоліо, відгуки і сторінки послуг мають працювати як одна система для запитів "фотограф Черкаси", "відеограф Черкаси", "весільна відеозйомка Черкаси".

## Поточний Стан

### Уже добре

| Напрям | Статус | Коментар |
|---|---:|---|
| Базовий домен | ✅ | `SITE_URL = https://metime.in.ua` у `lib/seo.ts` |
| Metadata base, canonical, OG/Twitter | ✅ | Є на головній, портфоліо, блозі, послугах і статтях |
| Robots | ✅ | `/admin/` і `/api/` закриті, sitemap вказано |
| Sitemap | ✅ | Головна, портфоліо, блог, послуги, service topics, blog posts |
| Image sitemap | ✅ | Окремий `/image-sitemap.xml` для портфоліо |
| LocalBusiness schema | ✅ | Є адреса, geo, телефон, email, hours, sameAs |
| Service schema | ✅ | Є для сторінок послуг |
| Service Offer schema | ✅ | Ціни вже додаються з `pricingData` у JSON-LD на головній |
| Article schema | ✅ | Є для blog posts і service topics |
| Breadcrumb schema | ✅ | Є для блогу, статей, послуг і портфоліо |
| FAQPage schema | ✅ | Реалізовано для сторінок з FAQ-блоками |
| Двомовний редактор | ✅ | Blog editor підтримує `uk/en` translations |
| Footer service links | ✅ | Послуги залишаються crawlable через футер |

### Що змінилось у висновках

| Старий висновок | Новий висновок |
|---|---|
| "FAQ schema треба додати" | Уже додано. Але Google більше не варто розглядати як стабільне джерело FAQ rich results для такого сайту. FAQ schema залишаємо для семантики, не як CTR-ставку. |
| "Service Offer schema без цін" | Уже є `price` і `priceCurrency: UAH` у `buildServiceOffersJsonLd()`. Потрібна тільки валідація і доповнення availability/url за потреби. |
| "Blog треба перевести з force-dynamic на ISR" | Не робити механічно, поки блог читає locale з cookies. Спершу треба вирішити мовну архітектуру. |
| "EN переклади є, але URL ті самі" | Це тепер P0-ризик, бо перекладів стало більше і cookie-locale почав впливати на публічний контент. |

## P0 - Критично

### 1. Винести мови в окремі URL

**Проблема:** зараз українська й англійська версії можуть жити на одному URL залежно від cookie `metime-locale`. Googlebot не повинен отримувати різний індексований контент на одному canonical URL.

**Правильний цільовий стан:**

| Мова | URL |
|---|---|
| Українська | `/` або `/uk/...` |
| Англійська | `/en/...` |
| Default | `x-default` на українську або language selector |

**План дій:**

1. Обрати архітектуру: рекомендовано залишити українську на корені, англійську винести в `/en`.
2. Додати route layer для locale: `app/[locale]/...` або явні `/en` маршрути для головної, блогу, послуг, статей.
3. Прибрати SEO-залежність від cookies на публічних сторінках. Cookie може лишитись для UI-перемикача, але canonical контент має визначатись URL.
4. Додати `alternates.languages` у metadata:
   - `uk: https://metime.in.ua/...`
   - `en: https://metime.in.ua/en/...`
   - `x-default: https://metime.in.ua/...`
5. Додати мовні alternates у `app/sitemap.ts`.
6. Зробити `buildArticleJsonLd()` і `buildWebsiteJsonLd()` locale-aware: `inLanguage: "uk-UA"` або `"en"`.
7. Не індексувати EN-сторінки, доки body content не перекладений повністю. Метаданих і коротких описів недостатньо.

**Файли:** `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/(services)/[service]/page.tsx`, `app/(services)/[service]/[topic]/page.tsx`, `lib/services/i18n.ts`, `lib/blog/types.ts`, `lib/seo.ts`, `app/sitemap.ts`.

### 2. Google Business Profile і локальний SEO-контур

**Проблема:** локальна видача для MeTime важливіша за generic blog-трафік. Без повністю оформленого Google Business Profile сайт недоотримує покази в Maps/Local Pack.

**План дій поза кодом:**

1. Перевірити або створити Google Business Profile.
2. Категорії: `Photographer`, `Video production service`, за наявності - `Wedding photographer`.
3. NAP має збігатись із сайтом:
   - Name: MeTime Studio
   - Phone: `+38 (098) 869-23-11`
   - City: Cherkasy
   - Instagram: `metime_ck`
4. Додати 30+ фото з портфоліо і 3-5 коротких відео.
5. Зібрати перші відгуки. Не додавати review schema для відгуків, які не розміщені на самому сайті.
6. Додати UTM до посилання з GBP на сайт.

**Файли в коді для синхронізації:** `lib/seo.ts`, `components/contact.tsx`, `components/footer.tsx`.

## P1 - Наступний Спринт

### 3. Переписати metadata для ключових сторінок під пошуковий намір

**Поточний стан:** metadata є, але частина сторінок звучить загально. Для локального SEO треба чіткіші title/description з містом і послугою.

**План:**

| Сторінка | Дія |
|---|---|
| `/portfolio` | Title/H1 зробити ближче до "Портфоліо фото та відеозйомки в Черкасах" |
| `/blog` | Metadata має відповідати URL-мові після впровадження `/en` |
| `/{service}` | Унікальні title/description з "Черкаси", типом зйомки і комерційним наміром |
| `/{service}/{topic}` | Article metadata + breadcrumbs + FAQ лишити, але зробити `inLanguage` locale-aware |
| `/blog/{slug}` | Перевірити, що EN-translation має повний title, description і body перед індексацією |

**Файли:** `app/portfolio/page.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/(services)/[service]/page.tsx`, `app/(services)/[service]/[topic]/page.tsx`.

### 4. Валідувати structured data після останніх змін

**Що перевірити:**

1. `LocalBusiness` на головній: required/recommended fields, logo/image, phone, address, opening hours.
2. `Service` і `Offer`: ціни без зайвих символів, `priceCurrency: UAH`, коректний service URL.
3. `Article`: `dateModified`, `image`, `author`, `inLanguage`.
4. `BreadcrumbList`: однакові назви з видимими крихтами.
5. `FAQPage`: залишати тільки якщо FAQ видимий на сторінці.

**Важливо:** FAQPage більше не плануємо як основний CTR-важіль у Google. Він корисний для структури контенту й AI/semantic understanding, але не повинен бути KPI.

**Файли:** `lib/seo.ts`, `app/page.tsx`, `app/blog/[slug]/page.tsx`, `app/(services)/[service]/[topic]/page.tsx`.

### 5. Портфоліо і image SEO

**Поточний стан:** image sitemap є, `next/image` використовується, але alt/caption здебільшого генеруються категорією або технічною назвою.

**План:**

1. Додати ручні поля `title`, `alt`, `caption` для фото в портфоліо.
2. Дати адмінці змогу редагувати ці поля.
3. У `image-sitemap.xml` використовувати людський caption, а не тільки категорію.
4. Для blog carousel фото після тимчасового random-підбору проставити змістові caption/alt.
5. Зробити стабільну OG-картинку портфоліо з локального `/public/images/og-portfolio.jpg`, а не Blob URL.

**Файли:** `lib/portfolio/types.ts`, `components/admin-portfolio-editor.tsx`, `lib/portfolio/image-src.ts`, `app/image-sitemap.xml/route.ts`, `lib/seo.ts`.

### 6. Внутрішня перелінковка

**Поточний стан:** послуги винесені у футер, це добре для crawlability. Але для SEO цього мало: потрібні контекстні посилання з блогу й сервісних статей.

**План:**

1. У кожній service topic статті додати 2-4 контекстні посилання:
   - на головну послугу;
   - на портфоліо;
   - на суміжну статтю;
   - на контакт/ціновий блок, якщо доречно.
2. У blog posts додати блок "Схожі матеріали".
3. У service landing сторінках додати curated список найважливіших статей, а не просто всі теми.

**Файли:** `data/services/services.json`, `data/blog/posts.json`, `components/latest-posts.tsx`, service/blog page components.

## P2 - Після Мовної Архітектури

### 7. Content hub і комерційні landing pages

**План нових/покращених кластерів:**

| Кластер | Цільові запити |
|---|---|
| Wedding | весільний фотограф Черкаси, весільний відеограф Черкаси, love story Черкаси |
| Dance | зйомка танців Черкаси, відео танцювальної школи, dance portfolio Ukraine |
| Kids | дитяча фотосесія Черкаси, хрестини фото відео, день народження зйомка |
| Brand | бренд зйомка Черкаси, контент для бізнесу, відео для Instagram |
| Portrait | портретна фотосесія Черкаси, індивідуальна зйомка |

**Правило:** кожна сторінка має мати один primary intent, не змішувати всі послуги в один текст.

### 8. Core Web Vitals і production-вимір

Локально це не має великого сенсу через API і blob-залежності. Перевіряти треба production URL:

1. PageSpeed Insights: `/`, `/portfolio`, `/blog`, 1 service page, 1 article.
2. Search Console Core Web Vitals після деплою.
3. Перевірити LCP на hero video і portfolio mosaic.
4. Перевірити CLS на fonts/images.
5. Перевірити INP на portfolio filters/lightbox.

**KPI:** LCP < 2.5s, INP < 200ms, CLS < 0.1.

### 9. EN SEO тільки після повного перекладу body

**Не індексувати англійські сторінки, якщо перекладені тільки title/description.** Для EN-індексації потрібні:

1. Повний body переклад.
2. EN slugs або стабільні `/en/...` URL.
3. `hreflang`.
4. EN metadata.
5. EN JSON-LD.
6. EN sitemap entries.
7. Internal links між EN-сторінками.

## P3 - Довгостроково

### 10. Reviews і trust signals

1. Додати сторінку/секцію з реальними відгуками, якщо є дозвіл клієнтів.
2. Review schema використовувати тільки для відгуків, які видимі на сайті.
3. Додати кейси: задача, формат зйомки, результат, фото/відео.
4. Для команди додати повніші Person schema: image, role, sameAs, worksFor.

### 11. Backlinks і локальні згадки

1. Партнерські лінки з локацій, ведучих, декораторів, танцювальних шкіл.
2. Локальні медіа/каталоги Черкас із коректним NAP.
3. Публікації кейсів із посиланнями на портфоліо.

## Оновлений Backlog

| Пріоритет | Задача | Тип | Орієнтир |
|---|---|---|---|
| P0 | URL-based i18n для `/en` + `hreflang` | Code/Architecture | 2-4 дні |
| P0 | GBP audit/setup + NAP sync | Off-site | 1 день |
| P1 | Locale-aware metadata і JSON-LD | Code | 1-2 дні |
| P1 | Portfolio metadata/H1/OG image cleanup | Code/Content | 0.5 дня |
| P1 | Structured data validation | QA | 0.5 дня |
| P1 | Manual alt/caption для portfolio і blog carousel | Code/Content | 1-2 дні |
| P1 | Contextual internal links у статтях | Content | 1 день |
| P2 | Production Core Web Vitals audit | QA/Perf | 1 день |
| P2 | Повні EN body translations | Content | 2-5 днів |
| P3 | Reviews/cases/trust pages | Content | 2-3 дні |

## KPI на 30 Днів

1. Search Console: усі важливі URL індексуються без duplicate/canonical проблем.
2. GBP: профіль активний, заповнений, з фото, послугами і першими відгуками.
3. Local queries: з'являються покази за "фотограф Черкаси", "відеограф Черкаси", "весільна відеозйомка Черкаси".
4. CTR: title/description для portfolio/service pages не нижче середнього по сайту.
5. Image Search: портфоліо фото мають impressions у GSC.
6. Core Web Vitals: production URLs у green або з чітким списком bottlenecks.

## Джерела

- Google Search Central: [Localized versions of your pages](https://developers.google.com/search/docs/advanced/crawling/localized-versions)
- Google Search Central: [Managing multi-regional and multilingual sites](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
- Google Search Central: [Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- Google Search Central: [Image SEO best practices](https://developers.google.com/search/docs/advanced/guidelines/google-images)
- Google Search Central: [Local Business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
