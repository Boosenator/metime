import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import type { BlogPost, BlogPostTranslation } from "./types"

const DATA_DIR = join(process.cwd(), "data", "blog")
const POSTS_FILE = join(DATA_DIR, "posts.json")

function ensureDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

export async function readBlogPosts(): Promise<BlogPost[]> {
  if (!existsSync(POSTS_FILE)) return []
  try {
    const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8")) as BlogPost[]
    return posts.map(normalizeBlogPost)
  } catch {
    return []
  }
}

export async function saveBlogPosts(posts: BlogPost[]): Promise<void> {
  ensureDir()
  await writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8")
}

export function normalizeBlogPost(post: BlogPost): BlogPost {
  const uk: BlogPostTranslation = {
    title: post.translations?.uk?.title ?? post.title ?? "",
    description: post.translations?.uk?.description ?? post.description ?? "",
    keywords: post.translations?.uk?.keywords ?? post.keywords ?? [],
    blocks: post.translations?.uk?.blocks ?? post.blocks ?? [],
  }

  return {
    ...post,
    title: uk.title,
    description: uk.description,
    keywords: uk.keywords,
    blocks: uk.blocks,
    translations: {
      ...post.translations,
      uk,
      en: post.translations?.en ?? {
        title: "",
        description: "",
        keywords: [],
        blocks: [],
      },
    },
  }
}
