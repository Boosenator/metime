import { writeFileSync } from "fs";

const url =
  "https://cdn.pixabay.com/video/2024/02/23/201655-916010498_large.mp4";

console.log("[v0] Downloading placeholder video...");

const res = await fetch(url);
if (!res.ok) throw new Error(`Failed: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync("/vercel/share/v0-project/public/images/hero-reel.mp4", buf);
console.log(`[v0] Saved hero-reel.mp4 (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
