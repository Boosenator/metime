"use client"

import { useState } from "react"
import { Check, MessageCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const categoryKeys = ["dance", "wedding", "kids", "brand", "custom"] as const
type CategoryKey = (typeof categoryKeys)[number]

export function Pricing() {
  const { t, locale } = useI18n()
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("dance")

  const categories = t.pricing.categories

  return (
    <section id="pricing" className="bg-dark-card px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
            {t.pricing.sectionLabel}
          </p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
            {t.pricing.title}
          </h2>
        </div>

        {/* Category Tabs - Sticky */}
        <div className="sticky top-16 z-40 -mx-6 mb-8 bg-dark-card/95 px-6 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categoryKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-all duration-300 md:px-6 md:py-3 md:text-sm ${
                  activeCategory === key
                    ? "border-b-2 border-wine bg-wine/10 text-wine"
                    : "border-b-2 border-transparent text-gray-mid hover:text-cream"
                }`}
              >
                {categories[key].title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeCategory === "custom" ? (
          <CustomPricing />
        ) : (
          <CategoryPricing categoryKey={activeCategory} />
        )}

        {/* Note + CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-mid">
            {t.pricing.note}
          </p>
          <a
            href="#contact"
            className="mt-6 inline-block border border-wine px-10 py-3 text-xs uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-wine"
          >
            {t.contact.cta}
          </a>
        </div>
      </div>
    </section>
  )
}

function CategoryPricing({ categoryKey }: { categoryKey: Exclude<CategoryKey, "custom"> }) {
  const { t, locale } = useI18n()
  const category = t.pricing.categories[categoryKey]

  return (
    <div className="space-y-12">
      {/* Packages Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {category.packages.map((pkg, idx) => (
          <div
            key={pkg.name}
            className={`group relative flex flex-col border transition-all duration-500 hover:-translate-y-1 ${
              idx === category.packages.length - 1
                ? "border-wine/40 bg-dark"
                : "border-gray-warm/50 bg-dark"
            }`}
          >
            {/* Accent line */}
            <div
              className={`h-px w-full transition-all duration-500 ${
                idx === category.packages.length - 1
                  ? "bg-wine"
                  : "bg-gray-warm group-hover:bg-wine"
              }`}
            />

            <div className="flex flex-1 flex-col p-6 md:p-8">
              <h3 className="font-serif text-xl font-light text-cream md:text-2xl">
                {pkg.name}
              </h3>
              <div className="mt-3">
                {pkg.price ? (
                  <span className="text-xl font-semibold text-cream md:text-2xl">
                    {pkg.price}
                  </span>
                ) : (
                  <span className="text-lg font-light text-gray-light">
                    {t.pricing.individual}
                  </span>
                )}
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-wine" />
                    <span className="text-sm leading-relaxed text-gray-light">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className="mt-6 block border border-gray-warm py-2.5 text-center text-xs uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:border-wine hover:bg-wine"
              >
                {t.pricing.choose}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Extras */}
      {category.extras && category.extras.length > 0 && (
        <div className="mx-auto max-w-2xl rounded-sm border border-gray-warm/30 bg-dark p-6 md:p-8">
          <h4 className="mb-4 text-center font-serif text-lg font-light text-cream">
            {t.pricing.extras}:
          </h4>
          <ul className="space-y-2 text-center">
            {category.extras.map((extra) => (
              <li key={extra} className="text-sm text-gray-light">
                • {extra}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CustomPricing() {
  const { t } = useI18n()
  const custom = t.pricing.categories.custom

  return (
    <div className="mx-auto max-w-2xl">
      <div className="border border-wine/30 bg-dark p-8 text-center md:p-12">
        {/* Title */}
        <h3 className="font-serif text-2xl font-light text-cream md:text-3xl">
          {custom.subtitle}
        </h3>
        <p className="mt-4 text-gray-light">
          {custom.description}
        </p>

        {/* Features */}
        <ul className="mt-8 space-y-3 text-left">
          {custom.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-wine" />
              <span className="text-sm leading-relaxed text-gray-light">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <p className="mt-8 font-serif text-lg italic text-gray-mid">
          {custom.cta}
        </p>

        <a
          href="https://instagram.com/metime_ck"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 border border-wine bg-wine/10 px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream transition-all duration-300 hover:bg-wine"
        >
          <MessageCircle className="h-4 w-4" />
          {t.pricing.contactUs}
        </a>
      </div>
    </div>
  )
}
