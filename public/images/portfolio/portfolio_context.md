<role>
Ти — senior full-stack інженер, що працює над сайтом MiTime Studio у VS Code.
Задача: повна переробка секції Portfolio з нуля — публічна сторінка + адмінка.
Стек проекту — працюй із тим, що вже є; нових фреймворків не вводь. Якщо архітектурний
вибір не очевидний, прийми мінімально достатнє рішення та задокументуй у progress.md.
</role>

<context_and_motivation>
Портфоліо — головна візитка студії. Воно має виглядати як велике мозаїчне полотно
приблизно зі 150 фото, де сусідні фото зливаються в кольорові регіони — ефект
кольорового ландшафту (НЕ райдуги). За замовчуванням сітка 12 колонок × 24 рядки,
але адмін може змінити розмір. Адмін також може вручну перекомпонувати мозаїку
(DnD) і розтягувати окремі фото на кілька клітинок по X/Y (corner resize).
</context_and_motivation>

<phase_1_cleanup>
ПЕРШИЙ крок, до будь-якої імплементації:
1. Знайди всі файли/компоненти/маршрути/стилі/типи/тести, пов'язані з поточним portfolio
   (публічним і адмінським). Виведи список у progress.md перед видаленням.
2. Видали їх повністю — код, імпорти, роути, CSS/Tailwind класи, тести, типи, асети.
3. Переконайся, що проект білдиться без помилок після видалення.
4. Один логічний коміт: `chore(portfolio): remove legacy implementation`.

Не залишай мертвих коментарів типу `// TODO remove` чи `// legacy`. Чистий cleanup.
</phase_1_cleanup>

<data_model>
Зберігання: файлова система + JSON у репо. Без БД, без зовнішніх CMS.

Структура:
- `/public/portfolio/photos/` — оригінали фото (jpg/webp). Унікальні filename (hash або uuid).
- `/data/portfolio/photos.json` — масив метаданих:
    {
      "id": "uuid",
      "filename": "abc123.webp",
      "width": 1920,
      "height": 1280,
      "dominantColor": "#a34f22",        // hex
      "lab": { "L": 45.2, "a": 28.1, "b": 34.9 },  // для кластеризації
      "uploadedAt": "ISO-8601"
    }
- `/data/portfolio/layout.json` — поточний layout:
    {
      "grid": { "cols": 12, "rows": 24 },
      "cells": [
        { "photoId": "uuid", "x": 0, "y": 0, "spanX": 1, "spanY": 1 },
        ...
      ],
      "version": 1,
      "updatedAt": "ISO-8601"
    }

Fallback: якщо layout.json відсутній або photos додані, але ще не розміщені —
запустити color-clustering алгоритм і згенерувати layout автоматично.
</data_model>

<public_page_logic>
Маршрут: `/portfolio` (або як прийнято у проекті).

Поведінка:
- Читає `layout.json` на стороні сервера (SSR/SSG/build-time, залежно від стеку).
- Рендерить CSS Grid із `grid.cols` колонок і `grid.rows` рядків.
- Кожне фото займає `spanX × spanY` клітинок через `grid-column: span X` / `grid-row: span Y`.
- `object-fit: cover` для фото, щоб заповнювало клітинку.
- Клік по фото → lightbox / галерея (попередня / наступна).
- Lazy loading + responsive зображення (srcset / next/image аналог, якщо є).
- Mobile: сітка адаптивно стискається (наприклад 12 → 6 → 4 колонок на брейкпойнтах),
  spans пропорційно масштабуються або обмежуються максимумом колонок.
</public_page_logic>

<color_clustering_algorithm>
Коли адмін натискає "Auto-arrange by color" АБО layout.json відсутній:

1. Якщо в photos.json фото без `dominantColor` / `lab` — порахувати:
   - Завантажити фото на server-side, downsample до 32×32, усереднити RGB.
   - Конвертувати RGB → Lab (перцептивний колірний простір).
   - Записати назад у photos.json. Обчислення робиться ОДИН РАЗ при upload, кешується.

2. Алгоритм кластер-розкладання (детермінований, seeded):
   - Обираємо 4 seed-фото для 4 кутів сітки — фото з найбільшою попарною Lab-відстанню
     (максимізуємо різноманітність кутів).
   - Для решти клітинок (проходимо у spiral / row-by-row порядку):
     при виборі фото для клітинки (x,y) — беремо доступне фото з мінімальною
     сумарною Lab-відстанню до вже розміщених 4-сусідних клітинок (top/left/bottom/right,
     які вже заповнені).
   - Це дає плавні кольорові регіони, а не різкі райдужні стрічки.

3. Усі фото стартують із `spanX=1, spanY=1`. Адмін може потім розтягувати вручну.
4. Якщо фото більше, ніж клітинок — зайві у "unplaced" pool (видно в адмінці збоку).
5. Якщо клітинок більше, ніж фото — порожні клітинки лишаються прозорими / subtle background.

Реалізація — чиста функція `arrangeByColor(photos, grid) → cells[]`, без side effects.
Це критично для тестування.
</color_clustering_algorithm>

<admin_page_logic>
Маршрут: `/admin/portfolio`. Авторизацію адміна вважай за існуючу (middleware) —
якщо її немає, ДОДАЙ мінімальну заглушку (env-based password), але НЕ реалізуй повну auth.

UI складається з трьох зон:

1) Toolbar (верх):
   - Інпути `cols` / `rows` (default 12/24, min 1, max ~40). Зміна → сітка перерендериться,
     фото, що виходять за межі, потрапляють у unplaced pool.
   - Кнопка "Auto-arrange by color" → виклик алгоритму, оновлення local state.
   - Кнопка "Upload photos" → multi-file input. На upload:
       a) файли пишуться у `/public/portfolio/photos/`,
       b) рахується dominantColor + Lab,
       c) метадані додаються в photos.json,
       d) нові фото з'являються в unplaced pool.
   - Кнопка "Save" (disabled, якщо немає змін) → POST/PUT на server endpoint, який
     атомарно перезаписує `layout.json` (і photos.json, якщо змінився).
   - Кнопка "Discard" → скинути local state до server version.

2) Grid editor (центр):
   - Візуальна сітка з видимими клітинками (subtle border).
   - Кожне розміщене фото — абсолютно позиційований елемент, що займає свої клітинки.
   - **Drag**: тягнеш фото → воно snap'ується до найближчої валідної клітинки при drop.
     Якщо цільова клітинка(и) зайняті іншим фото — свап місцями (переміщуване має пріоритет).
   - **Resize**: у правому-нижньому куті фото — handle. Drag handle → фото розтягується
     цілими клітинками по X і/або Y. При накладанні на інше фото:
       - Якщо інше фото поміщається у найближчу вільну область → автоматично зміщується туди.
       - Якщо ні → іде в unplaced pool.
   - Виділене фото підсвічується. Shift+Click для множинного виділення (опціонально, v2).

3) Unplaced pool (бокова панель):
   - Thumbnails фото, які ще не на сітці або випали після resize/resize grid.
   - Drag з pool → на сітку.

Persistence:
- Усі зміни тримаються у local state (React state / Zustand / аналог).
- Кнопка Save робить ОДИН server-side запис. Бекенд валідує JSON схему перед записом.
- Toast success / error. При error — local state не скидається.
</admin_page_logic>

<server_endpoints>
Мінімальний API:
- `POST /api/admin/portfolio/upload` — multipart, приймає фото, повертає метадані.
- `PUT  /api/admin/portfolio/layout` — приймає повний layout.json, валідує, записує.
- `GET  /api/admin/portfolio/state` — повертає photos.json + layout.json для адмінки.

Публічна сторінка читає JSON напряму (SSR/build-time), без API.
</server_endpoints>

<agent_guidelines>
- **Default to action**: читай кодбазу, склади план у progress.md, імплементуй фазу за фазою.
  Питання задавай тільки при реально заблокованих архітектурних рішеннях.
- **Parallel tool calls**: коли дії незалежні (читання кількох файлів, паралельні grep, etc) —
  викликай tools паралельно.
- **Жодних watch-режимів**: НЕ запускай `npm run dev`, `npm run test` у watch, `next dev` тощо.
  Для перевірки використовуй `build` і `test:run` (або проектні аналоги). Visual verification —
  через Vercel preview / staging.
- **State tracking**: на старті створи `progress.md` у корені з чеклистом фаз:
    - [ ] 1. Cleanup legacy portfolio
    - [ ] 2. Data model (photos.json, layout.json schemas)
    - [ ] 3. Color clustering algorithm + unit tests
    - [ ] 4. Public portfolio page
    - [ ] 5. Admin page — Grid editor (DnD + resize)
    - [ ] 6. Admin page — Toolbar (grid size, auto-arrange, upload, save)
    - [ ] 7. Server endpoints + validation
    - [ ] 8. Mobile responsiveness
    - [ ] 9. Performance check (150 фото render smooth)
  Оновлюй після кожної фази.
- **Tests (unit)**: мінімум покрити `arrangeByColor()` (детермінований input → очікуваний output)
  та conflict-resolver для drag/resize collision.
- **Git**: малі логічні коміти по фазах, conventional commits
  (`feat(portfolio): ...`, `chore(portfolio): ...`, `test(portfolio): ...`).
- **Залежності**: мінімальні. Для DnD — `@dnd-kit/core` (легкий, без залежностей React-DnD).
  Для color conversion — маленький util або `culori` (якщо вже є). Не тягни 10 пакетів.
- **Після кожної фази**: `build` + `test:run`. Тільки якщо зелене — commit і далі.
- **Performance**: при 150 фото публічна сторінка має рендеритись <1s FCP. Lazy-load
  фото поза вюпортом. Для адмінки — при потребі використай windowing (react-window).
</agent_guidelines>

<definition_of_done>
- [ ] Старий код portfolio повністю видалений, build зелений.
- [ ] Публічна сторінка рендерить мозаїку з layout.json, responsive, з lightbox.
- [ ] Color clustering — чиста детермінована функція, покрита тестами.
- [ ] Адмінка дозволяє: змінювати cols/rows, DnD фото, resize corner handle,
      auto-arrange by color, upload photos, save.
- [ ] Unplaced pool працює коректно при зменшенні grid або resize-конфліктах.
- [ ] Server endpoints валідують JSON, атомарно пишуть файли.
- [ ] 150+ фото рендеряться плавно на публічній сторінці і в адмінці.
- [ ] progress.md — всі фази закриті, build + test:run зелені.
- [ ] Коміти зроблені логічними порціями.
</definition_of_done>