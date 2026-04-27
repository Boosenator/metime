"use client"

import { useCallback, useMemo, useState } from "react"
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { getDefaultPricingData } from "@/lib/i18n"
import type {
  PricingCategoryKey,
  PricingData,
  PricingLocaleKey,
  PricingPackageItem,
  StandardPricingCategoryKey,
} from "@/lib/pricing/types"
import { PRICING_CATEGORY_KEYS } from "@/lib/pricing/types"

const STANDARD_CATEGORY_KEYS = PRICING_CATEGORY_KEYS.filter((key) => key !== "custom") as StandardPricingCategoryKey[]

function toLines(value: string[]) {
  return value.join("\n")
}

function fromLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function createPackage(category: StandardPricingCategoryKey, index: number): PricingPackageItem {
  return {
    id: `${category}-${Date.now()}-${index}`,
    name: "",
    price: "",
    features: [],
  }
}

export function AdminPricingEditor({ initialPricingData }: { initialPricingData: PricingData | null }) {
  const fallback = getDefaultPricingData()
  const [pricingData, setPricingData] = useState<PricingData>(initialPricingData ?? fallback)
  const [savedPricingData, setSavedPricingData] = useState<PricingData>(initialPricingData ?? fallback)
  const [activeLocale, setActiveLocale] = useState<PricingLocaleKey>("uk")
  const [activeCategory, setActiveCategory] = useState<PricingCategoryKey>("dance")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const isDirty = JSON.stringify(pricingData) !== JSON.stringify(savedPricingData)
  const localeData = pricingData[activeLocale]
  const activeCategoryData = localeData[activeCategory]

  const categoryLabels = useMemo(
    () => ({
      dance: localeData.dance.title || "Dance",
      wedding: localeData.wedding.title || "Wedding",
      kids: localeData.kids.title || "Kids",
      brand: localeData.brand.title || "Brand",
      custom: localeData.custom.title || "Custom",
    }),
    [localeData]
  )

  const updateStandardCategory = useCallback(
    (category: StandardPricingCategoryKey, updater: (categoryData: PricingData[PricingLocaleKey][StandardPricingCategoryKey]) => PricingData[PricingLocaleKey][StandardPricingCategoryKey]) => {
      setPricingData((prev) => ({
        ...prev,
        [activeLocale]: {
          ...prev[activeLocale],
          [category]: updater(prev[activeLocale][category]),
        },
      }))
    },
    [activeLocale]
  )

  const updateCustomCategory = useCallback(
    (updater: (categoryData: PricingData[PricingLocaleKey]["custom"]) => PricingData[PricingLocaleKey]["custom"]) => {
      setPricingData((prev) => ({
        ...prev,
        [activeLocale]: {
          ...prev[activeLocale],
          custom: updater(prev[activeLocale].custom),
        },
      }))
    },
    [activeLocale]
  )

  const save = useCallback(async () => {
    setSaving(true)
    setSaveMsg(null)

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingData),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      setSavedPricingData(pricingData)
      setSaveMsg("Saved")
    } catch (error) {
      setSaveMsg(`Error: ${error instanceof Error ? error.message : "unknown"}`)
    } finally {
      setSaving(false)
    }
  }, [pricingData])

  const discard = useCallback(() => {
    setPricingData(savedPricingData)
    setSaveMsg(null)
  }, [savedPricingData])

  return (
    <div className="min-h-screen bg-dark text-cream">
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-white/10 bg-dark/95 px-4 py-3 backdrop-blur-md">
        <a
          href="/admin/portfolio"
          className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfolio Admin
        </a>

        <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 p-1">
          {(["uk", "en"] as const).map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                activeLocale === locale ? "bg-wine text-cream" : "text-gray-mid hover:text-cream"
              }`}
            >
              {locale}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saveMsg ? <span className="text-xs text-gray-mid">{saveMsg}</span> : null}
          <button
            type="button"
            onClick={discard}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 rounded bg-wine px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:bg-wine/90 disabled:opacity-30"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-wine">Pricing Admin</p>
          <h1 className="mt-1 text-2xl text-cream">Price cards editor</h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {PRICING_CATEGORY_KEYS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                activeCategory === category
                  ? "border-wine bg-wine/10 text-wine"
                  : "border-white/10 bg-white/5 text-gray-mid hover:text-cream"
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {activeCategory === "custom" ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Tab title</span>
              <input
                type="text"
                value={activeCategoryData.title}
                onChange={(e) => updateCustomCategory((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Subtitle</span>
              <input
                type="text"
                value={activeCategoryData.subtitle}
                onChange={(e) => updateCustomCategory((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Description</span>
              <textarea
                value={activeCategoryData.description}
                onChange={(e) => updateCustomCategory((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Features, one per line</span>
              <textarea
                value={toLines(activeCategoryData.features)}
                onChange={(e) => updateCustomCategory((prev) => ({ ...prev, features: fromLines(e.target.value) }))}
                rows={6}
                className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">CTA text</span>
              <textarea
                value={activeCategoryData.cta}
                onChange={(e) => updateCustomCategory((prev) => ({ ...prev, cta: e.target.value }))}
                rows={3}
                className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Category title</span>
                <input
                  type="text"
                  value={activeCategoryData.title}
                  onChange={(e) =>
                    updateStandardCategory(activeCategory, (prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {activeCategoryData.packages.map((pkg, index) => (
                <article key={pkg.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg text-cream">Card {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateStandardCategory(activeCategory, (prev) => {
                            if (index === 0) return prev
                            const packages = [...prev.packages]
                            ;[packages[index - 1], packages[index]] = [packages[index], packages[index - 1]]
                            return { ...prev, packages }
                          })
                        }
                        className="rounded border border-white/10 bg-white/5 p-2 text-cream transition-colors hover:bg-white/10"
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStandardCategory(activeCategory, (prev) => {
                            if (index === prev.packages.length - 1) return prev
                            const packages = [...prev.packages]
                            ;[packages[index + 1], packages[index]] = [packages[index], packages[index + 1]]
                            return { ...prev, packages }
                          })
                        }
                        className="rounded border border-white/10 bg-white/5 p-2 text-cream transition-colors hover:bg-white/10"
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStandardCategory(activeCategory, (prev) => ({
                            ...prev,
                            packages: prev.packages.filter((item) => item.id !== pkg.id),
                          }))
                        }
                        className="rounded border border-red-900/40 bg-red-950/30 p-2 text-red-300 transition-colors hover:bg-red-950/50"
                        title="Delete card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Name</span>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) =>
                          updateStandardCategory(activeCategory, (prev) => ({
                            ...prev,
                            packages: prev.packages.map((item) => (item.id === pkg.id ? { ...item, name: e.target.value } : item)),
                          }))
                        }
                        className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Price</span>
                      <input
                        type="text"
                        value={pkg.price ?? ""}
                        onChange={(e) =>
                          updateStandardCategory(activeCategory, (prev) => ({
                            ...prev,
                            packages: prev.packages.map((item) => (item.id === pkg.id ? { ...item, price: e.target.value } : item)),
                          }))
                        }
                        className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Features, one per line</span>
                      <textarea
                        value={toLines(pkg.features)}
                        onChange={(e) =>
                          updateStandardCategory(activeCategory, (prev) => ({
                            ...prev,
                            packages: prev.packages.map((item) =>
                              item.id === pkg.id ? { ...item, features: fromLines(e.target.value) } : item
                            ),
                          }))
                        }
                        rows={6}
                        className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateStandardCategory(activeCategory, (prev) => ({
                  ...prev,
                  packages: [...prev.packages, createPackage(activeCategory, prev.packages.length + 1)],
                }))
              }
              className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add card
            </button>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-gray-mid">Extras, one per line</span>
                <textarea
                  value={toLines(activeCategoryData.extras)}
                  onChange={(e) =>
                    updateStandardCategory(activeCategory, (prev) => ({
                      ...prev,
                      extras: fromLines(e.target.value),
                    }))
                  }
                  rows={5}
                  className="w-full rounded border border-white/10 bg-dark px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-wine"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
