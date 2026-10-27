"use client"

import { useRef, useTransition } from "react"
import toast from "react-hot-toast"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { addHeroSlides, deleteHeroSlide, moveHeroSlide, type ContentResult } from "@/app/content/actions"
import { useLanguage } from "@/components/LanguageProvider"

type Slide = { id: number; image: string; sortOrder: number }

export default function HeroSlides({ slides, canEdit }: { slides: Slide[]; canEdit: boolean }) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const run = (action: () => Promise<ContentResult>, successMessage?: string) => {
    startTransition(async () => {
      let result
      try {
        result = await action()
      } catch (err) {
        console.error("Hero Slide Error:", err)
        toast.error(t("Upload failed — try fewer or smaller photos.", "อัปโหลดไม่สำเร็จ — ลองลดจำนวนหรือขนาดรูปภาพ"))
        return
      }
      if (!result.success) return void toast.error(result.error)
      if (successMessage) toast.success(successMessage)
    })
  }

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append("images", f))
    run(() => addHeroSlides(formData), t("Slides added", "เพิ่มสไลด์แล้ว"))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDelete = (slide: Slide) => {
    if (slides.length === 1) {
      const ok = window.confirm(
        t(
          "This is the last slide. The home page banner will be empty. Delete anyway?",
          "นี่คือสไลด์สุดท้าย แบนเนอร์หน้าแรกจะว่างเปล่า ต้องการลบหรือไม่?"
        )
      )
      if (!ok) return
    } else if (!window.confirm(t("Delete this slide?", "ลบสไลด์นี้ใช่หรือไม่?"))) {
      return
    }
    run(() => deleteHeroSlide(slide.id), t("Slide deleted", "ลบสไลด์แล้ว"))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {t(
          "Photos rotate at the top of the client home page, in this order.",
          "รูปภาพจะหมุนเวียนแสดงด้านบนของหน้าแรกเว็บไซต์ลูกค้า ตามลำดับนี้"
        )}
      </p>

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <button onClick={() => fileInputRef.current?.click()} disabled={isPending} className="btn-primary">
            <Plus size={16} />
            {isPending ? t("Working...", "กำลังดำเนินการ...") : t("Add Slides", "เพิ่มสไลด์")}
          </button>
        </>
      )}

      {slides.length === 0 ? (
        <p className="card empty-state">{t("No slides yet.", "ยังไม่มีสไลด์")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slides.map((slide, i) => (
            <div key={slide.id} className="card overflow-hidden">
              <div className="relative">
                <img src={slide.image} alt="" className="w-full h-44 object-cover" />
                <span className="absolute top-3 left-3 badge bg-black/60 text-white">#{i + 1}</span>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => run(() => moveHeroSlide(slide.id, "up"))}
                    disabled={isPending || i === 0}
                    aria-label={t("Move earlier", "เลื่อนขึ้น")}
                    className="btn-ghost px-3 py-1.5 disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => run(() => moveHeroSlide(slide.id, "down"))}
                    disabled={isPending || i === slides.length - 1}
                    aria-label={t("Move later", "เลื่อนลง")}
                    className="btn-ghost px-3 py-1.5 disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(slide)}
                    disabled={isPending}
                    className="btn-danger ml-auto px-3 py-1.5"
                  >
                    <Trash2 size={14} />
                    {t("Delete", "ลบ")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
