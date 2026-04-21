"use client"

import Image from "next/image"
import { useI18n } from "@/lib/i18n"

const teamMembers = [
  { id: "andrii", image: "/images/team/andrii.jpg" },
  { id: "nikita", image: "/images/team/Nikita.jpg" },
  { id: "anna", image: "/images/team/anna.jpg" },
  { id: "ihor", image: "/images/team/Ihor.jpg" },
] as const

export function Team() {
  const { t } = useI18n()

  return (
    <section id="team" className="bg-dark px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">
            {t.team.sectionLabel}
          </p>
          <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
            {t.team.title}
          </h2>
        </div>

        {/* Team Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => {
            const memberData = t.team.members[member.id]
            return (
              <div key={member.id} className="group cursor-default">
                {/* Photo */}
                <div className="relative mb-6 aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={memberData.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                  {/* Hover accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-wine transition-all duration-500 group-hover:w-full" />
                </div>

                {/* Info */}
                <div className="transition-transform duration-300 group-hover:-translate-y-1">
                  <h3 className="font-serif text-xl font-medium text-cream">
                    {memberData.name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-wine">
                    {memberData.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-mid">
                    {memberData.bio}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
