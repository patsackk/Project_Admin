"use client"

import { useState, useTransition } from "react"
import toast from "react-hot-toast"
import { useLanguage } from "@/components/LanguageProvider"

export default function AddEntityModal({
  addProject,
  addWorker,
  defaultType = "project",
  label = "+ Add",
}: any) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isProject = defaultType === "project"
  const { t } = useLanguage()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (isProject) {
        await addProject(formData)
      } else {
        await addWorker(formData)
      }

      setOpen(false)
      toast.success(isProject ? t("Project added", "เพิ่มโครงการแล้ว") : t("Worker added", "เพิ่มผู้ปฏิบัติงานแล้ว"))
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary px-4 py-1.5">
        {label}
      </button>

      {open && (
        <div className="modal-backdrop">
          <form action={handleSubmit} className="modal p-6 space-y-4">
            <h2 className="section-title">{isProject ? t("Add Project", "เพิ่มโครงการ") : t("Add Worker", "เพิ่มผู้ปฏิบัติงาน")}</h2>

            <div>
              <label className="label">{isProject ? t("Project Name", "ชื่อโครงการ") : t("Worker Name", "ชื่อผู้ปฏิบัติงาน")}</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="label">{isProject ? t("Location", "สถานที่") : t("Team", "ทีม")}</label>
              <input name={isProject ? "location" : "team"} required className="input" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                {t("Cancel", "ยกเลิก")}
              </button>
              <button disabled={pending} className="btn-primary">
                {pending ? t("Adding...", "กำลังเพิ่ม...") : isProject ? t("Add Project", "เพิ่มโครงการ") : t("Add Worker", "เพิ่มผู้ปฏิบัติงาน")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
