import type { Metadata } from "next"

export const SITE_NAME = "MeTime Studio"
export const SITE_URL = "https://v0-metime.vercel.app"
export const DEFAULT_LOCALE = "uk-UA"
export const SITE_TITLE = "MeTime Studio | Фото та відеозйомка в Черкасах"
export const SITE_DESCRIPTION =
  "MeTime Studio — фото та відеопродакшн у Черкасах. Весілля, love story, dance, портрет, бренд-зйомка та дитячі історії."
export const SITE_DESCRIPTION_EN =
  "MeTime Studio is a photo and video production studio in Cherkasy, Ukraine. Weddings, love story, dance, portrait, brand, and kids shoots."
export const OG_IMAGE = "/images/hero.jpg"

export const CONTACT_INFO = {
  email: "boosyonya@gmail.com",
  phone: "+380988693231",
  phoneDisplay: "+38 (098) 869-32-11",
  instagram: "metime_ck",
  instagramUrl: "https://instagram.com/metime_ck",
  city: "Cherkasy",
  country: "UA",
}

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString()
}

export function buildDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "відеограф Черкаси",
      "фотограф Черкаси",
      "весільна зйомка Черкаси",
      "love story Черкаси",
      "бренд зйомка",
      "портретна зйомка",
      "MeTime Studio",
      "videographer Cherkasy",
      "photographer Cherkasy",
      "wedding videography Ukraine",
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "photography",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: DEFAULT_LOCALE,
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} hero image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    referrer: "origin-when-cross-origin",
  }
}

export function buildStudioJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    name: SITE_NAME,
    image: absoluteUrl(OG_IMAGE),
    url: SITE_URL,
    telephone: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: CONTACT_INFO.city,
      addressCountry: CONTACT_INFO.country,
    },
    sameAs: [CONTACT_INFO.instagramUrl],
    description: SITE_DESCRIPTION,
    areaServed: ["Cherkasy", "Ukraine"],
    priceRange: "$$",
  }
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: ["uk-UA", "en"],
  }
}

export function buildPortfolioJsonLd(imageCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${SITE_NAME} Portfolio`,
    url: absoluteUrl("/portfolio"),
    description: SITE_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ImageGallery",
      name: "Portfolio Gallery",
      numberOfItems: imageCount,
    },
  }
}
