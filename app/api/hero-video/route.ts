const VIDEO_URL =
  "https://cdn.pixabay.com/video/2024/02/01/199089-908798043_tiny.mp4"

export async function GET() {
  const res = await fetch(VIDEO_URL)

  if (!res.ok) {
    return new Response("Video unavailable", { status: 502 })
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
