"use server"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"

// Same caveat as status photos: /public/uploads only persists on a host with
// a writable, persistent filesystem. The client site loads these from the
// admin app's origin (see middleware: /uploads is public).
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "content")

export type ContentKind = "project" | "service"

export type ContentResult = { success: true } | { success: false; error: string }

const PROJECT_TYPES = ["Residential", "Commercial"]

async function saveUploads(files: File[]) {
  if (files.length === 0) return []
  await mkdir(UPLOAD_DIR, { recursive: true })
  const paths: string[] = []
  for (const file of files) {
    const ext = path.extname(file.name) || ""
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    await writeFile(path.join(UPLOAD_DIR, safeName), Buffer.from(await file.arrayBuffer()))
    paths.push(`/uploads/content/${safeName}`)
  }
  return paths
}

const filesFrom = (formData: FormData, name: string) =>
  formData.getAll(name).filter((f): f is File => f instanceof File && f.size > 0)

const text = (formData: FormData, name: string) => formData.get(name)?.toString().trim() ?? ""

// Gallery paths the form says to keep. Only trust ones that already belonged
// to this record — never let the client smuggle in an arbitrary path.
function keptGallery(formData: FormData, owned: string[]) {
  try {
    const parsed = JSON.parse(formData.get("keepGallery")?.toString() ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string" && owned.includes(p))
      : []
  } catch {
    return []
  }
}

// Every action re-checks access on the server; the page hiding its buttons
// isn't enough on its own.
async function guard() {
  const t = await getT()
  const allowed = await hasAccess("manageContent")
  const denied: ContentResult = {
    success: false,
    error: t("You don't have permission to edit website content.", "คุณไม่มีสิทธิ์แก้ไขเนื้อหาเว็บไซต์"),
  }
  const failed: ContentResult = {
    success: false,
    error: t("Something went wrong. Please try again.", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"),
  }
  return { t, allowed, denied, failed }
}

// Creates a portfolio project or service, or updates one if formData has an "id".
export async function saveContent(kind: ContentKind, formData: FormData): Promise<ContentResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  const id = Number(formData.get("id")) || null
  const nameEn = text(formData, "nameEn")
  const type = text(formData, "type")
  if (!nameEn) return { success: false, error: t("Please enter the English name.", "กรุณากรอกชื่อภาษาอังกฤษ") }
  if (kind === "project" && !PROJECT_TYPES.includes(type)) {
    return { success: false, error: t("Please choose a project type.", "กรุณาเลือกประเภทผลงาน") }
  }

  try {
    const existing =
      id === null
        ? null
        : kind === "project"
        ? await prisma.portfolioProject.findUnique({ where: { id } })
        : await prisma.service.findUnique({ where: { id } })
    if (id !== null && !existing) {
      return { success: false, error: t("This item no longer exists.", "ไม่พบรายการนี้แล้ว") }
    }

    if (!existing && filesFrom(formData, "coverFile").length === 0) {
      return { success: false, error: t("Please upload a cover image.", "กรุณาอัปโหลดภาพหน้าปก") }
    }
    const [newCover] = await saveUploads(filesFrom(formData, "coverFile").slice(0, 1))
    const coverImage = newCover ?? existing!.coverImage

    const gallery = [
      ...keptGallery(formData, existing?.gallery ?? []),
      ...(await saveUploads(filesFrom(formData, "galleryFiles"))),
    ]

    const shared = {
      nameEn,
      nameTh: text(formData, "nameTh"),
      descriptionEn: text(formData, "descriptionEn"),
      descriptionTh: text(formData, "descriptionTh"),
      coverImage,
      gallery,
      sortOrder: Number(formData.get("sortOrder")) || 0,
    }

    if (kind === "project") {
      const data = {
        ...shared,
        locationEn: text(formData, "locationEn"),
        locationTh: text(formData, "locationTh"),
        type,
      }
      if (existing) await prisma.portfolioProject.update({ where: { id: existing.id }, data })
      else await prisma.portfolioProject.create({ data })
    } else {
      if (existing) await prisma.service.update({ where: { id: existing.id }, data: shared })
      else await prisma.service.create({ data: shared })
    }
  } catch (error) {
    console.error("Save Content Error:", error)
    return failed
  }

  revalidatePath("/content")
  return { success: true }
}

export async function deleteContent(kind: ContentKind, id: number): Promise<ContentResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    if (kind === "project") await prisma.portfolioProject.delete({ where: { id } })
    else await prisma.service.delete({ where: { id } })
  } catch (error) {
    console.error("Delete Content Error:", error)
    return failed
  }

  revalidatePath("/content")
  return { success: true }
}

export async function addHeroSlides(formData: FormData): Promise<ContentResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  const files = filesFrom(formData, "images")
  if (files.length === 0) {
    return { success: false, error: t("Please choose at least one image.", "กรุณาเลือกรูปภาพอย่างน้อย 1 รูป") }
  }

  try {
    const last = await prisma.heroSlide.findFirst({ orderBy: { sortOrder: "desc" } })
    const start = (last?.sortOrder ?? -1) + 1
    const paths = await saveUploads(files)
    await prisma.heroSlide.createMany({
      data: paths.map((image, i) => ({ image, sortOrder: start + i })),
    })
  } catch (error) {
    console.error("Add Hero Slides Error:", error)
    return failed
  }

  revalidatePath("/content")
  return { success: true }
}

// Swaps a slide with its neighbour so admins can reorder without typing numbers.
export async function moveHeroSlide(id: number, direction: "up" | "down"): Promise<ContentResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    const slides = await prisma.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })
    const index = slides.findIndex((s) => s.id === id)
    const target = direction === "up" ? index - 1 : index + 1
    if (index === -1 || target < 0 || target >= slides.length) return { success: true }

    // Renumber everything so ties in sortOrder can't turn the swap into a no-op.
    const reordered = [...slides]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await prisma.$transaction(
      reordered.map((s, i) => prisma.heroSlide.update({ where: { id: s.id }, data: { sortOrder: i } }))
    )
  } catch (error) {
    console.error("Move Hero Slide Error:", error)
    return failed
  }

  revalidatePath("/content")
  return { success: true }
}

export async function deleteHeroSlide(id: number): Promise<ContentResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    await prisma.heroSlide.delete({ where: { id } })
  } catch (error) {
    console.error("Delete Hero Slide Error:", error)
    return failed
  }

  revalidatePath("/content")
  return { success: true }
}
