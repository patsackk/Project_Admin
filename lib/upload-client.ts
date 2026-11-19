import { upload } from "@vercel/blob/client"
import type { UploadFolder } from "@/lib/uploads"

let blobEnabled: Promise<boolean> | null = null

// Asked once per page load: is there a Blob store (on Vercel), or do files
// go with the form as before (local dev)?
function isBlobEnabled() {
  blobEnabled ??= fetch("/api/upload")
    .then((res) => (res.ok ? res.json() : { enabled: false }))
    .then((data) => !!data.enabled)
    .catch(() => false)
  return blobEnabled
}

// Before a form is sent to a server action: upload its photos straight to
// Vercel Blob and put their URLs in the form instead of the files. Keeps the
// request small — Vercel rejects requests over 4.5 MB.
export async function uploadFormFiles(formData: FormData, fields: string[], folder: UploadFolder) {
  if (!(await isBlobEnabled())) return

  for (const field of fields) {
    const entries = formData.getAll(field)
    formData.delete(field)
    for (const entry of entries) {
      if (typeof entry === "string") {
        formData.append(field, entry)
      } else if (entry.size > 0) {
        const blob = await upload(`${folder}/${entry.name}`, entry, {
          access: "public",
          handleUploadUrl: "/api/upload",
        })
        formData.append(field, blob.url)
      }
    }
  }
}
