import { mkdir, writeFile } from "fs/promises"
import path from "path"

export const UPLOAD_FOLDERS = ["status", "content"] as const
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]

// A photo the browser already uploaded to this app's Vercel Blob store.
// Only accept those — never let a form smuggle in an arbitrary URL.
function isOwnBlobUrl(value: string, folder: UploadFolder) {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${folder}/`)
    )
  } catch {
    return false
  }
}

// Photos chosen in a form. On Vercel they arrive as Blob URLs (uploaded by
// lib/upload-client.ts); in local dev without a Blob store they arrive as
// files, which are written to /public/uploads/<folder>.
export function uploadEntries(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((entry) => (typeof entry === "string" ? entry.length > 0 : entry.size > 0))
}

export async function saveUploads(entries: FormDataEntryValue[], folder: UploadFolder): Promise<string[]> {
  const paths: string[] = []
  for (const entry of entries) {
    if (typeof entry === "string") {
      if (isOwnBlobUrl(entry, folder)) paths.push(entry)
      continue
    }
    const dir = path.join(process.cwd(), "public", "uploads", folder)
    await mkdir(dir, { recursive: true })
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(entry.name)}`
    await writeFile(path.join(dir, safeName), Buffer.from(await entry.arrayBuffer()))
    paths.push(`/uploads/${folder}/${safeName}`)
  }
  return paths
}
