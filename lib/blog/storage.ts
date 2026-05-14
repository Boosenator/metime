import { existsSync, mkdirSync, readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import type { BlogPost } from "./types"

const DATA_DIR = join(process.cwd(), "data", "blog")
const POSTS_FILE = join(DATA_DIR, "posts.json")

function ensureDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

export async function readBlogPosts(): Promise<BlogPost[]> {
  if (!existsSync(POSTS_FILE)) return []
  try {
    return JSON.parse(readFileSync(POSTS_FILE, "utf8")) as BlogPost[]
  } catch {
    return []
  }
}

export async function saveBlogPosts(posts: BlogPost[]): Promise<void> {
  ensureDir()
  await writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8")
}
