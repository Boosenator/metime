export const PRICING_CATEGORY_KEYS = ["dance", "wedding", "kids", "brand", "custom"] as const

export type PricingCategoryKey = (typeof PRICING_CATEGORY_KEYS)[number]
export type StandardPricingCategoryKey = Exclude<PricingCategoryKey, "custom">
export type PricingLocaleKey = "uk" | "en"

export type PricingPackageItem = {
  id: string
  name: string
  price: string | null
  features: string[]
}

export type PricingStandardCategory = {
  title: string
  packages: PricingPackageItem[]
  extras: string[]
}

export type PricingCustomCategory = {
  title: string
  subtitle: string
  description: string
  features: string[]
  cta: string
}

export type PricingLocaleData = {
  dance: PricingStandardCategory
  wedding: PricingStandardCategory
  kids: PricingStandardCategory
  brand: PricingStandardCategory
  custom: PricingCustomCategory
}

export type PricingData = {
  uk: PricingLocaleData
  en: PricingLocaleData
  updatedAt: string
}
