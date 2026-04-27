import type { Metadata } from "next"
import { AdminPricingEditor } from "@/components/admin-pricing-editor"
import { readPricingData } from "@/lib/pricing/storage"

export const metadata: Metadata = {
  title: "Admin Pricing",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export const dynamic = "force-dynamic"

export default async function AdminPricingPage() {
  const pricingData = await readPricingData()
  return <AdminPricingEditor initialPricingData={pricingData} />
}
