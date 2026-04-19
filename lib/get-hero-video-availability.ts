import { existsSync } from "fs"
import path from "path"

export function getHeroVideoAvailability() {
  const heroDir = path.join(process.cwd(), "public", "media", "hero")

  return {
    hasDesktopVideo: existsSync(path.join(heroDir, "desktop.mp4")),
    hasMobileVideo: existsSync(path.join(heroDir, "mobile.mp4")),
  }
}
