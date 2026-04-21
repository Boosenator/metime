"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type Locale = "uk" | "en"

type PricingCategory = {
  title: string
  packages: {
    name: string
    price: string | null
    features: string[]
  }[]
  extras?: string[]
}

type Translations = {
  nav: {
    portfolio: string
    pricing: string
    team: string
    contact: string
    book: string
  }
  hero: {
    subtitle: string
    title1: string
    title2: string
    location: string
    cta: string
    scroll: string
  }
  portfolio: {
    title: string
    photo: string
    video: string
    photoCount: string
    videoCount: string
    categories: {
      all: string
      dance: string
      wedding: string
      kids: string
      brand: string
      lovestory: string
      portrait: string
      commercial: string
      custom: string
    }
  }
  pricing: {
    sectionLabel: string
    title: string
    from: string
    choose: string
    individual: string
    note: string
    contactUs: string
    extras: string
    categories: {
      dance: PricingCategory
      wedding: PricingCategory
      kids: PricingCategory
      brand: PricingCategory
      custom: {
        title: string
        subtitle: string
        description: string
        features: string[]
        cta: string
      }
    }
  }
  team: {
    sectionLabel: string
    title: string
    members: {
      andrii: { name: string; role: string; bio: string }
      nikita: { name: string; role: string; bio: string }
      anna: { name: string; role: string; bio: string }
      ihor: { name: string; role: string; bio: string }
    }
  }
  contact: {
    sectionLabel: string
    title1: string
    title2: string
    subtitle: string
    cta: string
  }
  footer: {
    tagline: string
    location: string
    rights: string
  }
}

const translations: Record<Locale, Translations> = {
  uk: {
    nav: {
      portfolio: "Портфоліо",
      pricing: "Ціни",
      team: "Команда",
      contact: "Контакт",
      book: "Записатися",
    },
    hero: {
      subtitle: "Photo & Video Production Studio",
      title1: "Ми фіксуємо моменти,",
      title2: "які залишаються назавжди",
      location: "Черкаси, Україна",
      cta: "Записатися на зйомку",
      scroll: "Далі",
    },
    portfolio: {
      title: "Наші роботи",
      photo: "Фото",
      video: "Відео",
      photoCount: "фото",
      videoCount: "відео",
      categories: {
        all: "Усі",
        dance: "Танці",
        wedding: "Весілля",
        kids: "Діти",
        brand: "Бренд",
        custom: "Інше",
        lovestory: "Love Story",
        portrait: "Портрет",
        commercial: "Бренд",
      },
    },
    pricing: {
      sectionLabel: "Ціни",
      title: "Наші пакети",
      from: "від",
      choose: "Обрати",
      individual: "Індивідуально",
      note: "Усі ціни можуть бути адаптовані під ваші потреби",
      contactUs: "Зв'язатися",
      extras: "Можливість додати",
      categories: {
        dance: {
          title: "Dance",
          packages: [
            {
              name: "Basic Moves",
              price: "1 500 ₴",
              features: [
                "Відеозйомка танцю (до 1 год.)",
                "Запис кількох дублів одного танцювального номеру",
                "Мінімальний монтаж: накладання музики, базова корекція кольору",
              ],
            },
            {
              name: "Flowing Performance",
              price: "3 000 ₴",
              features: [
                "Відеозйомка танцю (до 2 год.)",
                "На одній або декількох локаціях",
                "Зйомка повної хореографії з плавними переходами між дублями",
                "Підбір найкращих моментів, легкі переходи, додавання музики",
              ],
            },
            {
              name: "Energy Blend",
              price: "3 500 ₴",
              features: [
                "Відеозйомка (до 3 год.)",
                "На одній або декількох локаціях",
                "Зйомка повної хореографії або окремих елементів танцю та деталями",
                "Монтаж кліпу (до 1 хв.)",
              ],
            },
            {
              name: "Dynamic Vibes",
              price: "4 500 ₴",
              features: [
                "Відеозйомка танцю (до 4 год.)",
                "На декількох локаціях",
                "Комплексна зйомка з деталями",
                "Ретельний монтаж з додаванням ефектів, динамічних переходів",
                "Кліп (до 4 хв.) з професійною обробкою",
              ],
            },
          ],
          extras: [
            "Додатковий оператор (+2000₴ / год.)",
            "Додаткова година зйомки (+2000₴)",
            "Додатковий монтаж короткого кліпу до 30 сек (+1000₴)",
          ],
        },
        wedding: {
          title: "Wedding",
          packages: [
            {
              name: "Minimal",
              price: "6 000 ₴",
              features: [
                "Відеозйомка (до 3 год.)",
                "Короткий кліп (до 3 хв.)",
                "Готове відео в Full HD якості",
              ],
            },
            {
              name: "Classic",
              price: "9 000 ₴",
              features: [
                "Відеозйомка (до 5 год.)",
                "Короткий кліп (до 3 хв.)",
                "Повне весільне відео (до 30 хвилин)",
              ],
            },
            {
              name: "Premium",
              price: "12 000 ₴",
              features: [
                "Відеозйомка (до 8 год.)",
                "Короткий кліп (до 5 хв.)",
                "Повне весільне відео (до 45 хв.)",
                'Додаткова зйомка "ранок наречених"',
              ],
            },
            {
              name: "Luxury",
              price: "20 000 ₴",
              features: [
                "Повний день зйомки (до 14 год.)",
                "Короткий кліп (до 5 хв.)",
                "Повне весільне відео (до 1 год.)",
                "Експрес монтаж весільного відео ще під час святкування",
              ],
            },
          ],
          extras: [
            "Експрес монтаж — готовий кліп ще під час святкування (+2000₴)",
            "Додатковий оператор (+2000₴ / год.)",
            "Додаткова година зйомки (+2000₴)",
          ],
        },
        kids: {
          title: "Kids",
          packages: [
            {
              name: "Gender Party",
              price: "4 000 ₴",
              features: [
                "Відеозйомка (до 2 години)",
                "Зйомка декорацій, підготовки та моменту відкриття статі дитини",
                "Емоції гостей та святкові активності",
                "Монтаж кліпу (до 5 хвилин) з музичним супроводом",
              ],
            },
            {
              name: "Christening",
              price: "4 500 ₴",
              features: [
                "Зйомка в церкві: обряд хрещення",
                "Моменти з батьками та хрещеними після церемонії",
                "Монтаж кліпу (до 15 хвилин) з атмосферною музикою",
              ],
            },
            {
              name: "Birthday",
              price: "6 000 ₴",
              features: [
                "Відеозйомка (до 3 години)",
                "На одній або декількох локаціях",
                "Інтерв'ю з батьками або близькими (за бажанням)",
                "Монтаж святкового відео (до 4 хвилин) з яскравими переходами та ефектами",
              ],
            },
          ],
          extras: [
            "Додатковий оператор (+2000₴ / год.)",
            "Додаткова година зйомки (+2000₴)",
            "Створення короткого інтерв'ю з гостями або рідними (+1500₴)",
          ],
        },
        brand: {
          title: "Brand",
          packages: [
            {
              name: "Spotlight",
              price: "5 000 ₴",
              features: [
                "Відеозйомка (до 2 год.)",
                "Лаконічний монтаж з акцентом на основні моменти продукту",
                "Коротке відео (до 30 сек.)",
              ],
            },
            {
              name: "Focus",
              price: "7 500 ₴",
              features: [
                "Відеозйомка (до 3 год.)",
                "Відео (до 1 хв.)",
                "Стильна кольорокорекція та мінімальні ефекти",
              ],
            },
            {
              name: "Highlight",
              price: "8 500 ₴",
              features: [
                "Відеозйомка (4 години)",
                "Відео (до 2 хв.) з показом закулісних моментів або виробничих процесів",
                "Професійний монтаж з додаванням музичного супроводу та титрів",
              ],
            },
            {
              name: "Course Creation",
              price: "10 000 ₴",
              features: [
                "Зйомка навчального курсу (до 6 год.)",
                "Повний монтаж з додаванням титрів, слайдів та графіки для навчальних цілей",
                "Звуковий супровід та синхронізація з презентаціями або іншими навчальними матеріалами",
              ],
            },
          ],
          extras: [
            "Додатковий оператор (+2000₴ / год.)",
            "Додаткова година зйомки (+2000₴)",
            "Створення інтерактивних елементів або анімації (+3000₴)",
          ],
        },
        custom: {
          title: "Custom",
          subtitle: "Не знайшов ідеальний пакет?",
          description: "Ми завжди відкриті до нових ідей та нестандартних рішень!",
          features: [
            "Тривалість зйомки за домовленістю",
            "Індивідуальні сцени та ефекти",
            "Персоналізоване редагування відео, ефекти та анімація",
            "Додаткові відеографи, освітлення, реквізит, ідеї та багато іншого!",
          ],
          cta: "Напиши нам в дірект, і ми разом створимо індивідуальний варіант спеціально для тебе",
        },
      },
    },
    team: {
      sectionLabel: "Команда",
      title: "Наша команда",
      members: {
        andrii: {
          name: "Андрій",
          role: "Відеограф",
          bio: "Створює кінематографічні історії, які захоплюють з першого кадру",
        },
        nikita: {
          name: "Нікіта",
          role: "Відеограф / Фотограф",
          bio: "Універсальний майстер, який бачить красу в кожному моменті",
        },
        anna: {
          name: "Анна",
          role: "Монтажер",
          bio: "Перетворює відзняті матеріали на емоційні шедеври",
        },
        ihor: {
          name: "Ігор",
          role: "Менеджер",
          bio: "Координує процеси та забезпечує бездоганний сервіс",
        },
      },
    },
    contact: {
      sectionLabel: "Контакт",
      title1: "Давайте створимо",
      title2: "щось неймовірне",
      subtitle: "Розкажіть нам про вашу ідею, і ми втілимо її в життя",
      cta: "Написати в Instagram",
    },
    footer: {
      tagline: "Моменти, які залишаються назавжди",
      location: "Черкаси, Україна",
      rights: "Усі права захищено.",
    },
  },
  en: {
    nav: {
      portfolio: "Portfolio",
      pricing: "Pricing",
      team: "Team",
      contact: "Contact",
      book: "Book Now",
    },
    hero: {
      subtitle: "Photo & Video Production Studio",
      title1: "We capture moments",
      title2: "that last forever",
      location: "Cherkasy, Ukraine",
      cta: "Book a Shoot",
      scroll: "Scroll",
    },
    portfolio: {
      title: "Our Work",
      photo: "Photo",
      video: "Video",
      photoCount: "photos",
      videoCount: "videos",
      categories: {
        all: "All",
        dance: "Dance",
        wedding: "Wedding",
        lovestory: "Love Story",
        portrait: "Portrait",
        commercial: "Brand",
        kids: "Kids",
        brand: "Brand",
        custom: "Custom",
      },
    },
    pricing: {
      sectionLabel: "Pricing",
      title: "Our Packages",
      from: "from",
      choose: "Choose",
      individual: "Custom",
      note: "All prices can be adapted to your needs",
      contactUs: "Contact Us",
      extras: "Options to add",
      categories: {
        dance: {
          title: "Dance",
          packages: [
            {
              name: "Basic Moves",
              price: "1 500 ₴",
              features: [
                "Dance videography (up to 1 hr)",
                "Recording multiple takes of one dance number",
                "Minimal editing: music overlay, basic color correction",
              ],
            },
            {
              name: "Flowing Performance",
              price: "3 000 ₴",
              features: [
                "Dance videography (up to 2 hrs)",
                "One or multiple locations",
                "Full choreography filming with smooth transitions",
                "Best moments selection, easy transitions, music addition",
              ],
            },
            {
              name: "Energy Blend",
              price: "3 500 ₴",
              features: [
                "Videography (up to 3 hrs)",
                "One or multiple locations",
                "Full choreography or individual dance elements with details",
                "Clip editing (up to 1 min)",
              ],
            },
            {
              name: "Dynamic Vibes",
              price: "4 500 ₴",
              features: [
                "Dance videography (up to 4 hrs)",
                "Multiple locations",
                "Complex filming with details",
                "Careful editing with effects and dynamic transitions",
                "Clip (up to 4 min) with professional processing",
              ],
            },
          ],
          extras: [
            "Additional operator (+2000₴ / hr)",
            "Extra filming hour (+2000₴)",
            "Additional short clip editing up to 30 sec (+1000₴)",
          ],
        },
        wedding: {
          title: "Wedding",
          packages: [
            {
              name: "Minimal",
              price: "6 000 ₴",
              features: [
                "Videography (up to 3 hrs)",
                "Short clip (up to 3 min)",
                "Final video in Full HD quality",
              ],
            },
            {
              name: "Classic",
              price: "9 000 ₴",
              features: [
                "Videography (up to 5 hrs)",
                "Short clip (up to 3 min)",
                "Full wedding video (up to 30 min)",
              ],
            },
            {
              name: "Premium",
              price: "12 000 ₴",
              features: [
                "Videography (up to 8 hrs)",
                "Short clip (up to 5 min)",
                "Full wedding video (up to 45 min)",
                '"Morning of the newlyweds" additional filming',
              ],
            },
            {
              name: "Luxury",
              price: "20 000 ₴",
              features: [
                "Full day filming (up to 14 hrs)",
                "Short clip (up to 5 min)",
                "Full wedding video (up to 1 hr)",
                "Express editing during the celebration",
              ],
            },
          ],
          extras: [
            "Express editing — clip ready during celebration (+2000₴)",
            "Additional operator (+2000₴ / hr)",
            "Extra filming hour (+2000₴)",
          ],
        },
        kids: {
          title: "Kids",
          packages: [
            {
              name: "Gender Party",
              price: "4 000 ₴",
              features: [
                "Videography (up to 2 hours)",
                "Filming decorations, preparation, and gender reveal moment",
                "Guest emotions and festive activities",
                "Clip editing (up to 5 min) with music",
              ],
            },
            {
              name: "Christening",
              price: "4 500 ₴",
              features: [
                "Church filming: christening ceremony",
                "Moments with parents and godparents after the ceremony",
                "Clip editing (up to 15 min) with atmospheric music",
              ],
            },
            {
              name: "Birthday",
              price: "6 000 ₴",
              features: [
                "Videography (up to 3 hours)",
                "One or multiple locations",
                "Interview with parents or close ones (optional)",
                "Festive video editing (up to 4 min) with bright transitions and effects",
              ],
            },
          ],
          extras: [
            "Additional operator (+2000₴ / hr)",
            "Extra filming hour (+2000₴)",
            "Short interview with guests or relatives (+1500₴)",
          ],
        },
        brand: {
          title: "Brand",
          packages: [
            {
              name: "Spotlight",
              price: "5 000 ₴",
              features: [
                "Videography (up to 2 hrs)",
                "Concise editing focusing on key product moments",
                "Short video (up to 30 sec)",
              ],
            },
            {
              name: "Focus",
              price: "7 500 ₴",
              features: [
                "Videography (up to 3 hrs)",
                "Video (up to 1 min)",
                "Stylish color correction and minimal effects",
              ],
            },
            {
              name: "Highlight",
              price: "8 500 ₴",
              features: [
                "Videography (4 hours)",
                "Video (up to 2 min) showing behind-the-scenes or production",
                "Professional editing with music and titles",
              ],
            },
            {
              name: "Course Creation",
              price: "10 000 ₴",
              features: [
                "Educational course filming (up to 6 hrs)",
                "Full editing with titles, slides, and graphics",
                "Audio sync with presentations or other materials",
              ],
            },
          ],
          extras: [
            "Additional operator (+2000₴ / hr)",
            "Extra filming hour (+2000₴)",
            "Interactive elements or animation (+3000₴)",
          ],
        },
        custom: {
          title: "Custom",
          subtitle: "Didn't find the ideal package?",
          description: "We're always open to new ideas and non-standard solutions!",
          features: [
            "Flexible filming duration",
            "Individual scenes and effects",
            "Personalized video editing, effects, and animation",
            "Additional videographers, lighting, props, ideas, and much more!",
          ],
          cta: "Write to us in DM and we'll create an individual option specially for you",
        },
      },
    },
    team: {
      sectionLabel: "Team",
      title: "Our Team",
      members: {
        andrii: {
          name: "Andrii",
          role: "Videographer",
          bio: "Creates cinematic stories that captivate from the first frame",
        },
        nikita: {
          name: "Nikita",
          role: "Videographer / Photographer",
          bio: "A versatile master who sees beauty in every moment",
        },
        anna: {
          name: "Anna",
          role: "Editor",
          bio: "Transforms footage into emotional masterpieces",
        },
        ihor: {
          name: "Ihor",
          role: "Manager",
          bio: "Coordinates processes and ensures flawless service",
        },
      },
    },
    contact: {
      sectionLabel: "Contact",
      title1: "Let's create",
      title2: "something amazing",
      subtitle: "Tell us about your idea, and we'll bring it to life",
      cta: "Message on Instagram",
    },
    footer: {
      tagline: "Moments that last forever",
      location: "Cherkasy, Ukraine",
      rights: "All rights reserved.",
    },
  },
}

type I18nContextType = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uk")

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
