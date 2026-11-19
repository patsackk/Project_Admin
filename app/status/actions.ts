"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getT } from "@/lib/i18n-server"
import { saveUploads, uploadEntries } from "@/lib/uploads"

export type SaveStatusUpdateResult =
  | { success: true }
  | { success: false; error: string }

// Creates a new update, or edits an existing one if formData has an "id" —
// but only while that existing update is still a draft. Once an update has
// been posted (isDraft: false) it's part of the client-visible record and
// can't be silently rewritten; post a follow-up update instead.
export async function saveStatusUpdate(formData: FormData): Promise<SaveStatusUpdateResult> {
  const session = await getSession()
  const t = await getT()
  if (session?.role !== "admin") {
    return {
      success: false,
      error: t("You must be signed in as staff to post an update.", "ต้องเข้าสู่ระบบในฐานะพนักงานจึงจะโพสต์อัปเดตได้"),
    }
  }

  const id = formData.get("id")?.toString()
  const clientId = formData.get("clientId")?.toString()
  const projectId = formData.get("projectId")?.toString()
  const status = formData.get("status")?.toString()
  const percentComplete = Number(formData.get("percentComplete") ?? 0)
  const notes = formData.get("notes")?.toString().trim()
  const intent = formData.get("intent")?.toString() // "draft" | "post"

  if (!status) return { success: false, error: t("Please choose a status.", "กรุณาเลือกสถานะ") }
  if (!notes) return { success: false, error: t("Please describe the progress made.", "กรุณาอธิบายความคืบหน้าของงาน") }
  if (!clientId && !projectId) {
    return { success: false, error: t("Please select a client or a project.", "กรุณาเลือกลูกค้าหรือโครงการ") }
  }

  let existing = null
  if (id) {
    existing = await prisma.statusUpdate.findUnique({ where: { id: Number(id) } })
    if (!existing) return { success: false, error: t("This update no longer exists.", "ไม่พบอัปเดตนี้แล้ว") }
    if (!existing.isDraft) {
      return {
        success: false,
        error: t("Posted updates can't be edited — post a follow-up instead.", "อัปเดตที่โพสต์แล้วแก้ไขไม่ได้ — กรุณาโพสต์อัปเดตใหม่แทน"),
      }
    }
  }

  // Vercel Blob URLs on Vercel, files in local dev — see lib/uploads.ts.
  const newPhotoPaths = await saveUploads(uploadEntries(formData, "photos"), "status")

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
    return { success: false, error: t("Something went wrong. Please try again.", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง") }
  }

  revalidatePath("/status")
  return { success: true }
}
