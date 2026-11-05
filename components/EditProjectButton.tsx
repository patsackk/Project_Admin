"use client"

import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Pencil } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { updateProject } from "@/app/actions"
import type { ProjectOption } from "@/components/ProjectSelect"

// "Edit" link + popup to rename a project or change its location.
export default function EditProjectButton({
  project,
  onSaved,
  className = "",
}: {
  project: ProjectOption
  onSaved?: (project: ProjectOption) => void
  className?: string
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = (formData: FormData) =>
    startTransition(async () => {
      const result = await updateProject(
        project.id,
        formData.get("name")?.toString() ?? "",
        formData.get("location")?.toString() ?? "",
      )
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t("Project updated", "แก้ไขโครงการแล้ว"))
      setOpen(false)
      onSaved?.(result.project)
      router.refresh()
    })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs font-medium text-sky-700 transition hover:text-sky-900 hover:underline ${className}`}
      >
        <Pencil size={12} /> {t("Edit", "แก้ไข")}
      </button>

      {/* Portal: the popup goes on <body>, so it's valid wherever the button
          sits (inside a <p>, a table cell, another form…). */}
      {open &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setOpen(false)}>
            <form action={submit} className="modal space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="section-title">{t("Edit Project", "แก้ไขโครงการ")}</h2>
              <div>
                <label className="label">{t("Project Name", "ชื่อโครงการ")}</label>
                <input name="name" defaultValue={project.name} required autoFocus className="input" />
              </div>
              <div>
                <label className="label">{t("Location", "สถานที่")}</label>
                <input name="location" defaultValue={project.location} className="input" />
                <p className="mt-1 text-xs text-gray-500">
                  {t("Clients on this project use this location too.", "ลูกค้าในโครงการนี้จะใช้สถานที่นี้ด้วย")}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                  {t("Cancel", "ยกเลิก")}
                </button>
                <button disabled={pending} className="btn-primary">
                  {pending ? t("Saving…", "กำลังบันทึก…") : t("Save", "บันทึก")}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </>
  )
}
