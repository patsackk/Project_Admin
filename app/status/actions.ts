"use server"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// Photos are written to /public/uploads/status. That only persists on a
// host with a writable, persistent filesystem (fine for this dev setup /
// a traditional server); it will NOT survive redeploys on a serverless
// host like Vercel — swap for object storage before deploying there.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "status")

export type SaveStatusUpdateResult =
  | { success: true }
  | { success: false; error: string }

// Creates a new update, or edits an existing one if formData has an "id" —
// but only while that existing update is still a draft. Once an update has
// been posted (isDraft: false) it's part of the client-visible record and
// can't be silently rewritten; post a follow-up update instead.
export async function saveStatusUpdate(formData: FormData): Promise<SaveStatusUpdateResult> {
  const session = await getSession()
  if (session?.role !== "admin") {
    return { success: false, error: "You must be signed in as staff to post an update." }
  }

  const id = formData.get("id")?.toString()
  const clientId = formData.get("clientId")?.toString()
  const projectId = formData.get("projectId")?.toString()
  const status = formData.get("status")?.toString()
  const percentComplete = Number(formData.get("percentComplete") ?? 0)
  const notes = formData.get("notes")?.toString().trim()
  const intent = formData.get("intent")?.toString() // "draft" | "post"

  if (!status) return { success: false, error: "Please choose a status." }
  if (!notes) return { success: false, error: "Please describe the progress made." }
  if (!clientId && !projectId) {
    return { success: false, error: "Please select a client or a project." }
  }

  let existing = null
  if (id) {
    existing = await prisma.statusUpdate.findUnique({ where: { id: Number(id) } })
    if (!existing) return { success: false, error: "This update no longer exists." }
    if (!existing.isDraft) {
      return { success: false, error: "Posted updates can't be edited — post a follow-up instead." }
    }
  }

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)

  const newPhotoPaths: string[] = []
  if (photoFiles.length > 0) {
    await mkdir(UPLOAD_DIR, { recursive: true })
    for (const file of photoFiles) {
      const ext = path.extname(file.name) || ""
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(UPLOAD_DIR, safeName), buffer)
      newPhotoPaths.push(`/uploads/status/${safeName}`)
    }
  }

  // Which of the existing photos the form kept (unchecked ones were
  // removed). Only trust entries that actually belonged to this record —
  // never let the client smuggle in an arbitrary path.
  let keptPhotoPaths: string[] = []
  const keepPhotosRaw = formData.get("keepPhotos")?.toString()
  if (keepPhotosRaw && existing) {
    try {
      const parsed = JSON.parse(keepPhotosRaw)
      if (Array.isArray(parsed)) {
        keptPhotoPaths = parsed.filter(
          (p): p is string => typeof p === "string" && existing!.photos.includes(p)
        )
      }
    } catch {
      // ignore malformed input, fall back to keeping none
    }
  }

  const data = {
    clientId: clientId ? Number(clientId) : null,
    projectId: projectId ? Number(projectId) : null,
    status,
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
    notes,
    photos: [...keptPhotoPaths, ...newPhotoPaths],
    isDraft: intent === "draft",
  }

  try {
    if (existing) {
      await prisma.statusUpdate.update({ where: { id: existing.id }, data })
    } else {
      await prisma.statusUpdate.create({ data: { ...data, authorId: Number(session.sub) } })
    }
  } catch (error) {
    console.error("Save Status Update Error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  revalidatePath("/status")
  return { success: true }
}
