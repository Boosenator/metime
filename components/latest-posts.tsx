import type { BlogPost } from "@/lib/blog/types"

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Весілля",
  dance: "Танець",
  kids: "Діти",
  brand: "Бренд",
  lovestory: "Love Story",
  portrait: "Портрет",
  custom: "Різне",
}

export function LatestPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null

  return (
    <section className="bg-dark px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-wine">Блог</p>
            <h2 className="font-serif text-3xl font-light text-cream md:text-5xl lg:text-6xl">
              Корисні статті
            </h2>
          </div>
          <a
            href="/blog"
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-gray-mid transition-colors hover:text-cream"
          >
            Всі статті →
          </a>
        </div>

        <div className="grid gap-px bg-white/8 md:grid-cols-3">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-dark p-8 transition-colors duration-300 hover:bg-dark-card"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-wine">
                {CATEGORY_LABELS[post.category] ?? post.category}
              </p>
              <h3 className="mb-3 font-serif text-xl font-light text-cream transition-colors duration-300 group-hover:text-wine line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-mid line-clamp-3">
                {post.description}
              </p>
              <p className="mt-6 text-xs text-gray-mid/40">
                {new Date(post.publishedAt).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
