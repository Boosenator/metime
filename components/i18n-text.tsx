"use client"

import { useI18n } from "@/lib/i18n"

export function ServicesLabel() {
  const { t } = useI18n()

  return <>{t.services.sectionLabel}</>
}
