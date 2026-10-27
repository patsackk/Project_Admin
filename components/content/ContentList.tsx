"use client"

import { useRef, useState, useTransition } from "react"
import toast from "react-hot-toast"
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react"
import { deleteContent, saveContent, type ContentKind } from "@/app/content/actions"
import { useLanguage } from "@/components/LanguageProvider"

// Portfolio projects and services share one editor; projects just have a
// few extra fields (location, type).
export type ContentItem = {
  id: number
  nameEn: string
  nameTh: string
  descriptionEn: string
  descriptionTh: string
  coverImage: string
  gallery: string[]
  sortOrder: number
  locationEn?: string
  locationTh?: string
  type?: string
}

export default function ContentList({
  kind,
  items,
  canEdit,
}: {
  kind: ContentKind
  items: ContentItem[]
  canEdit: boolean
}) {
  const { t } = useLanguage()
  // undefined = closed, null = adding a new item
  const [editing, setEditing] = useState<ContentItem | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  const isProject = kind === "project"
  const typeLabel = (type?: string) =>
    type === "Commercial" ? t("Commercial", "เชิงพาณิชย์") : t("Residential", "ที่พักอาศัย")

  const handleDelete = (item: ContentItem) => {
    const confirmed = window.confirm(
      t(`Delete “${item.nameEn}” from the website?`, `ลบ “${item.nameTh || item.nameEn}” ออกจากเว็บไซต์ใช่หรือไม่?`)
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteContent(kind, item.id)
      if (!result.success) return void toast.error(result.error)
      toast.success(t("Deleted", "ลบแล้ว"))
    })
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <button onClick={() => setEditing(null)} className="btn-primary">
          <Plus size={16} />
          {isProject ? t("Add Project", "เพิ่มผลงาน") : t("Add Service", "เพิ่มบริการ")}
        </button>
      )}

      {items.length === 0 ? (
        <p className="card empty-state">{t("Nothing here yet.", "ยังไม่มีรายการ")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden flex flex-col">
              <div className="relative h-40 bg-gray-100">
                <img src={item.coverImage} alt={item.nameEn} className="w-full h-full object-cover" />
                {isProject && (
                  <span
                    className={`absolute top-3 left-3 badge text-white ${
                      item.type === "Commercial" ? "bg-slate-700" : "bg-sky-600"
                    }`}
                  >
                    {typeLabel(item.type)}
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900">{item.nameEn}</h3>
                <p className="text-sm text-gray-500">
                  {item.nameTh || <span className="italic text-amber-600">{t("No Thai name", "ยังไม่มีชื่อภาษาไทย")}</span>}
                </p>
                {isProject && item.locationEn && (
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin size={12} />
                    {item.locationEn}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {t(`${item.gallery.length} gallery photos`, `รูปในแกลเลอรี ${item.gallery.length} รูป`)} ·{" "}
                  {t(`Order ${item.sortOrder}`, `ลำดับ ${item.sortOrder}`)}
                </p>

                {canEdit && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditing(item)} className="btn-secondary flex-1 px-3 py-1.5">
                      <Pencil size={14} />
                      {t("Edit", "แก้ไข")}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isPending}
                      className="btn-danger flex-1 px-3 py-1.5"
                    >
                      <Trash2 size={14} />
                      {t("Delete", "ลบ")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ContentForm
          kind={kind}
          item={editing}
          nextOrder={items.length}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}

function ContentForm({
  kind,
  item,
  nextOrder,
  onClose,
}: {
  kind: ContentKind
  item: ContentItem | null
  nextOrder: number
  onClose: () => void
}) {
  const { t } = useLanguage()
  const formRef = useRef<HTMLFormElement>(null)
  const [keptGallery, setKeptGallery] = useState<string[]>(item?.gallery ?? [])
  const [coverPreview, setCoverPreview] = useState<string | null>(item?.coverImage ?? null)
  const [newGalleryCount, setNewGalleryCount] = useState(0)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const isProject = kind === "project"

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    if (item) formData.set("id", String(item.id))
    formData.set("keepGallery", JSON.stringify(keptGallery))

    setError("")
    startTransition(async () => {
      let result
      try {
        result = await saveContent(kind, formData)
      } catch (err) {
        console.error("Save Content Error:", err)
        setError(t("Upload failed — try fewer or smaller photos.", "อัปโหลดไม่สำเร็จ — ลองลดจำนวนหรือขนาดรูปภาพ"))
        return
      }
      if (!result.success) return setError(result.error)
      toast.success(t("Saved — now live on the website", "บันทึกแล้ว — แสดงบนเว็บไซต์แล้ว"))
      onClose()
    })
  }

  const title = item
    ? t(`Edit “${item.nameEn}”`, `แก้ไข “${item.nameTh || item.nameEn}”`)
    : isProject
    ? t("Add Project", "เพิ่มผลงาน")
    : t("Add Service", "เพิ่มบริการ")

  return (
    <div className="modal-backdrop">
      <form ref={formRef} onSubmit={submit} className="modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="section-title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "ปิด")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="alert-error">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{t("Name (English)", "ชื่อ (ภาษาอังกฤษ)")} *</label>
              <input name="nameEn" required defaultValue={item?.nameEn} className="input" />
            </div>
            <div>
              <label className="label">{t("Name (Thai)", "ชื่อ (ภาษาไทย)")}</label>
              <input name="nameTh" defaultValue={item?.nameTh} className="input" />
            </div>

            {isProject && (
              <>
                <div>
                  <label className="label">{t("Location (English)", "สถานที่ (ภาษาอังกฤษ)")}</label>
                  <input name="locationEn" defaultValue={item?.locationEn} placeholder="Thalang - Phuket" className="input" />
                </div>
                <div>
                  <label className="label">{t("Location (Thai)", "สถานที่ (ภาษาไทย)")}</label>
                  <input name="locationTh" defaultValue={item?.locationTh} placeholder="ถลาง - ภูเก็ต" className="input" />
                </div>
                <div>
                  <label className="label">{t("Type", "ประเภท")}</label>
                  <select name="type" defaultValue={item?.type ?? "Residential"} className="input">
                    <option value="Residential">{t("Residential", "ที่พักอาศัย")}</option>
                    <option value="Commercial">{t("Commercial", "เชิงพาณิชย์")}</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="label">{t("Display order", "ลำดับการแสดง")}</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={item?.sortOrder ?? nextOrder}
                className="input"
              />
              <p className="text-[11px] text-gray-400 mt-1">{t("Lower numbers show first.", "เลขน้อยจะแสดงก่อน")}</p>
            </div>
          </div>

          <div>
            <label className="label">{t("Description (English)", "รายละเอียด (ภาษาอังกฤษ)")}</label>
            <textarea name="descriptionEn" rows={3} defaultValue={item?.descriptionEn} className="input resize-none" />
          </div>
          <div>
            <label className="label">{t("Description (Thai)", "รายละเอียด (ภาษาไทย)")}</label>
            <textarea name="descriptionTh" rows={3} defaultValue={item?.descriptionTh} className="input resize-none" />
          </div>

          {/* Cover */}
          <div>
            <label className="label">{t("Cover image", "ภาพหน้าปก")} {!item && "*"}</label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img src={coverPreview} alt="" className="w-28 h-20 object-cover rounded-lg border border-gray-200" />
              )}
              <input
                type="file"
                name="coverFile"
                accept="image/*"
                required={!item}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setCoverPreview(file ? URL.createObjectURL(file) : item?.coverImage ?? null)
                }}
                className="text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t("Shown on the list page and at the top of the detail page.", "แสดงในหน้ารายการและด้านบนของหน้ารายละเอียด")}
            </p>
          </div>

          {/* Gallery */}
          <div>
            <label className="label">{t("Gallery", "แกลเลอรี")}</label>
            {keptGallery.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-3">
                {keptGallery.map((src) => (
                  <div key={src} className="relative group">
                    <img src={src} alt="" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setKeptGallery((prev) => prev.filter((p) => p !== src))}
                      aria-label={t("Remove photo", "ลบรูปภาพ")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-gray-800 text-white sm:opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              name="galleryFiles"
              accept="image/*"
              multiple
              onChange={(e) => setNewGalleryCount(e.target.files?.length ?? 0)}
              className="text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {newGalleryCount > 0
                ? t(`${newGalleryCount} new photos will be added.`, `จะเพิ่มรูปใหม่ ${newGalleryCount} รูป`)
                : t("Add photos to the gallery. Hover a photo above and tap ✕ to remove it.", "เพิ่มรูปในแกลเลอรี วางเมาส์บนรูปด้านบนแล้วกด ✕ เพื่อลบ")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <button disabled={isPending} className="btn-primary">
            {isPending ? t("Saving...", "กำลังบันทึก...") : t("Save", "บันทึก")}
          </button>
        </div>
      </form>
    </div>
  )
}
