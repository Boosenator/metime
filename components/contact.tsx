"use client"

import { Instagram, Mail, Phone } from "lucide-react"
import { useI18n } from "@/lib/i18n"

const CONTACT_INFO = {
  email: "boosyonya@gmail.com",
  phone: "+380988693231",
  phoneDisplay: "+38 (098) 869-32-11",
  instagram: "metime_ck",
  instagramUrl: "https://instagram.com/metime_ck",
}

export function Contact() {
  const { t } = useI18n()

  return (
    <section
      id="contact"
      className="bg-dark-card px-6 py-16 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* Header */}
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
          {t.contact.sectionLabel}
        </p>
        <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
          {t.contact.title1}
          <br />
          {t.contact.title2}
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-gray-mid">
          {t.contact.subtitle}
        </p>

        {/* CTA Button */}
        <a
          href={CONTACT_INFO.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-10 inline-flex items-center gap-3 bg-wine px-10 py-5 text-sm uppercase tracking-[0.2em] text-cream transition-all duration-500 hover:bg-wine-dark"
        >
          <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span>{t.contact.cta}</span>
        </a>

        {/* Contact Details */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="group flex items-center gap-2 text-sm text-gray-mid transition-colors duration-300 hover:text-cream"
          >
            <Mail className="h-4 w-4 text-wine" />
            {CONTACT_INFO.email}
          </a>
          <a
            href={`tel:${CONTACT_INFO.phone}`}
            className="group flex items-center gap-2 text-sm text-gray-mid transition-colors duration-300 hover:text-cream"
          >
            <Phone className="h-4 w-4 text-wine" />
            {CONTACT_INFO.phoneDisplay}
          </a>
          <a
            href={CONTACT_INFO.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm text-gray-mid transition-colors duration-300 hover:text-cream"
          >
            <Instagram className="h-4 w-4 text-wine" />
            @{CONTACT_INFO.instagram}
          </a>
        </div>
      </div>
    </section>
  )
}
