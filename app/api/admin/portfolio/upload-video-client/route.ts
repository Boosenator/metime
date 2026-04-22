import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/portfolio/admin-auth"

export async function POST(request: Request): Promise<NextResponse> {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("portfolio/videos/")) {
          throw new Error("Invalid upload pathname")
        }

        return {
          access: "public",
          addRandomSuffix: false,
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-m4v",
            "video/mpeg",
            "video/ogg",
          ],
        }
      },
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload token error" },
      { status: 400 }
    )
  }
}
