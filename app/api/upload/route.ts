import { issueSignedToken } from "@vercel/blob"
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { UPLOAD_FOLDERS, blobConfigured } from "@/lib/uploads"

// Photos go straight from the browser to Vercel Blob (see
// lib/upload-client.ts), so they never hit Vercel's 4.5 MB request limit.
// This route only hands out a short-lived, single-file permission to upload.

// The forms ask this first: without a Blob store (local dev) they send the
// files with the form instead, and they're saved to /public/uploads.
export async function GET() {
  return NextResponse.json({ enabled: blobConfigured() })
}

const UPLOAD_RULES = {
  allowedContentTypes: ["image/*"],
  maximumSizeInBytes: 15 * 1024 * 1024,
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const session = await getSession()
        if (session?.role !== "admin") throw new Error("Not signed in")
        if (!UPLOAD_FOLDERS.some((folder) => pathname.startsWith(`${folder}/`))) {
          throw new Error("Invalid upload folder")
        }
        const token = await issueSignedToken({ pathname, operations: ["put"], ...UPLOAD_RULES })
        return { token, urlOptions: { ...UPLOAD_RULES, addRandomSuffix: true } }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
