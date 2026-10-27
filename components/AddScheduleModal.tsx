"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { useLanguage } from "@/components/LanguageProvider"

export default function AddScheduleModal({ workers, projects, action }: any) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { t } = useLanguage()

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => {
          setError("")
          setOpen(true)
        }}
        className="btn-primary px-4 py-1.5"
      >
        {t("+ Add Schedule", "+ เพิ่มตารางงาน")}
      </button>

      {/* MODAL */}
      {open && (
        <div className="modal-backdrop">
          <form
  onSubmit={async (e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    setSubmitting(true)
    setError("")

    const result = await action(formData)

    setSubmitting(false)

    if (result?.success === false) {
      setError(result.error || t("Something went wrong.", "เกิดข้อผิดพลาด"))
      return
    }

    setOpen(false)
    toast.success(t("Schedule added", "เพิ่มตารางงานแล้ว"))
  }}
            className="modal p-6 space-y-4"
          >
            <h2 className="section-title">
              {t("Assign Schedule", "มอบหมายตารางงาน")}
            </h2>

            {error && (
              <p className="alert-error">
                {error}
              </p>
            )}

            {/* Worker */}
            <div>
              <label className="label">{t("Worker", "ผู้ปฏิบัติงาน")}</label>
              <select name="workerId" className="input">
                {workers.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="label">{t("Project", "โครงการ")}</label>
              <select name="projectId" className="input">
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="label">{t("Date", "วันที่")}</label>
              <input
                type="date"
                name="date"
                className="input"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("Start", "เริ่ม")}</label>
                <input
                  type="time"
                  name="startTime"
                  defaultValue="08:00"
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t("End", "สิ้นสุด")}</label>
                <input
                  type="time"
                  name="endTime"
                  defaultValue="16:00"
                  className="input"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost"
              >
                {t("Cancel", "ยกเลิก")}
              </button>

              <button
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? t("Saving...", "กำลังบันทึก...") : t("Save", "บันทึก")}
              </button>
            </div>
          </form>
        </div>
      )}

    </>
  )
}