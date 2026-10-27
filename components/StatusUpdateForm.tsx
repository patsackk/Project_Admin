"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import toast from "react-hot-toast"
import { Plus, X } from "lucide-react"
import { saveStatusUpdate } from "@/app/status/actions"
import { useLanguage } from "@/components/LanguageProvider"
import type { Translate } from "@/lib/i18n"

type ClientOption = { id: number; name: string; projectId: number | null }
type ProjectOption = { id: number; name: string }
type UpdateOption = {
  id: number
  clientId: number | null
  clientName: string | null
  projectId: number | null
  projectName: string | null
  status: string
  percentComplete: number
  notes: string
  photos: string[]
  isDraft: boolean
  createdAt: string
}

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"]

// Status values are stored in English; translate only for display.
function statusLabel(status: string, t: Translate) {
  const labels: Record<string, string> = {
    "Not Started": t("Not Started", "ยังไม่เริ่ม"),
    "In Progress": t("In Progress", "กำลังดำเนินการ"),
    Completed: t("Completed", "เสร็จสมบูรณ์"),
  }
  return labels[status] ?? status
}

function statusBadgeClass(status: string) {
  if (status === "Completed") return "bg-green-100 text-green-700"
  if (status === "In Progress") return "bg-sky-100 text-sky-700"
  return "bg-gray-100 text-gray-600"
}

export default function StatusUpdateForm({
  clients,
  projects,
  updates,
}: {
  clients: ClientOption[]
  projects: ProjectOption[]
  updates: UpdateOption[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clientQuery, setClientQuery] = useState("")
  const [showClientOptions, setShowClientOptions] = useState(false)
  const [clientId, setClientId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [status, setStatus] = useState(STATUS_OPTIONS[0])
  const [notes, setNotes] = useState("")
  const [percent, setPercent] = useState(0)
  const [photoNames, setPhotoNames] = useState<string[]>([])
  const [keptPhotos, setKeptPhotos] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [pendingIntent, setPendingIntent] = useState<"draft" | "post" | null>(null)
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateOption | null>(null)
  const [editingUpdate, setEditingUpdate] = useState<UpdateOption | null>(null)
  const { t, locale } = useLanguage()

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim()) return clients
    const q = clientQuery.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, clientQuery])

  // Scoped to whichever client/project is currently selected — never a
  // mixed feed of every client's updates at once. Nothing selected means
  // nothing shown yet.
  const filteredUpdates = useMemo(() => {
    if (!clientId && !projectId) return []
    return updates.filter((u) => {
      if (clientId && u.clientId !== clientId) return false
      if (projectId && u.projectId !== projectId) return false
      return true
    })
  }, [updates, clientId, projectId])

  const selectedProjectName = projects.find((p) => p.id === projectId)?.name ?? null

  const selectClient = (c: ClientOption) => {
    setClientId(c.id)
    setClientQuery(c.name)
    setShowClientOptions(false)
    if (c.projectId) setProjectId(c.projectId)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setPhotoNames(Array.from(files).map((f) => f.name))
  }

  const resetForm = () => {
    formRef.current?.reset()
    setClientId(null)
    setClientQuery("")
    setProjectId(null)
    setStatus(STATUS_OPTIONS[0])
    setNotes("")
    setPercent(0)
    setPhotoNames([])
    setKeptPhotos([])
    setEditingUpdate(null)
  }

  // A draft is still private — safe to load back into the form and
  // resave. A posted update is part of the client-visible record, so
  // clicking it only opens the read-only detail view below instead.
  const startEdit = (u: UpdateOption) => {
    setEditingUpdate(u)
    setClientId(u.clientId)
    setClientQuery(u.clientName ?? "")
    setProjectId(u.projectId)
    setStatus(u.status)
    setNotes(u.notes)
    setPercent(u.percentComplete)
    setPhotoNames([])
    setKeptPhotos(u.photos)
  }

  const removeKeptPhoto = (src: string) => {
    setKeptPhotos((prev) => prev.filter((p) => p !== src))
  }

  const submit = (intent: "draft" | "post") => {
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    formData.set("intent", intent)
    if (clientId) formData.set("clientId", String(clientId))
    if (projectId) formData.set("projectId", String(projectId))
    if (editingUpdate) {
      formData.set("id", String(editingUpdate.id))
      formData.set("keepPhotos", JSON.stringify(keptPhotos))
    }

    setPendingIntent(intent)
    startTransition(async () => {
      let result
      try {
        result = await saveStatusUpdate(formData)
      } catch (error) {
        console.error("Save Status Update Error:", error)
        toast.error(t("Upload failed — try fewer or smaller photos.", "อัปโหลดไม่สำเร็จ — ลองลดจำนวนหรือขนาดรูปภาพ"))
        return
      }
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(
        intent === "draft"
          ? t("Draft saved", "บันทึกฉบับร่างแล้ว")
          : t("Posted — now visible to the client", "โพสต์แล้ว — ลูกค้าสามารถดูได้แล้ว")
      )
      resetForm()
    })
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            {editingUpdate ? t("Editing Draft", "กำลังแก้ไขฉบับร่าง") : t("Progress Submission Form", "แบบฟอร์มส่งความคืบหน้า")}
          </h2>
          {editingUpdate && (
            <button
              type="button"
              onClick={resetForm}
              className="btn-ghost text-xs"
            >
              {t("Cancel edit — start a new update", "ยกเลิกการแก้ไข — เริ่มอัปเดตใหม่")}
            </button>
          )}
        </div>

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Client search */}
            <div className="relative">
              <label className="label">
                {t("Select Client", "เลือกลูกค้า")}
              </label>
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value)
                  setClientId(null)
                  setShowClientOptions(true)
                }}
                onFocus={() => setShowClientOptions(true)}
                onBlur={() => setTimeout(() => setShowClientOptions(false), 100)}
                placeholder={t("Search client database...", "ค้นหาลูกค้า...")}
                className="input"
              />
              {showClientOptions && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-sky-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="label">
                {t("Select Project", "เลือกโครงการ")}
              </label>
              <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="input"
              >
                <option value="">{t("No project", "ไม่มีโครงการ")}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label">
                {t("Status", "สถานะ")}
              </label>
              <select
                name="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s, t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Percent complete */}
            <div>
              <label className="label">
                {t("Percent Complete", "เปอร์เซ็นต์ความคืบหน้า")} ({percent}%)
              </label>
              <input
                type="range"
                name="percentComplete"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="mt-2 w-full accent-sky-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              {t("Detail Notes", "รายละเอียดความคืบหน้า")}
            </label>
            <textarea
              name="notes"
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                "Describe the specific progress made since the last update. Mention any milestones reached or challenges overcome...",
                "อธิบายความคืบหน้าตั้งแต่การอัปเดตครั้งล่าสุด รวมถึงเป้าหมายที่สำเร็จหรืออุปสรรคที่แก้ไขได้..."
              )}
              className="input resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="label">
              {t("Upload Photos", "อัปโหลดรูปภาพ")}
            </label>
            {keptPhotos.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {keptPhotos.map((src) => (
                  <div key={src} className="relative group">
                    <img
                      src={src}
                      alt={t("Existing progress photo", "รูปภาพความคืบหน้าเดิม")}
                      className="w-full h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeKeptPhoto(src)}
                      aria-label={t("Remove photo", "ลบรูปภาพ")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const files = e.dataTransfer.files
                if (fileInputRef.current) fileInputRef.current.files = files
                handleFiles(files)
              }}
              className="mt-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl py-8 text-center hover:border-sky-400 hover:bg-sky-50/50 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                name="photos"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-sky-50 text-sky-600 mb-2">
                <Plus size={18} />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {photoNames.length > 0
                  ? t(
                      `${photoNames.length} new photo${photoNames.length > 1 ? "s" : ""} to add`,
                      `รูปภาพใหม่ ${photoNames.length} รูป`
                    )
                  : t("Drag & drop photos or click to browse", "ลากและวางรูปภาพ หรือคลิกเพื่อเลือกไฟล์")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {keptPhotos.length > 0
                  ? t(
                      "Adds to the photos above — remove any you no longer want by hovering and tapping the ✕.",
                      "จะเพิ่มต่อจากรูปภาพด้านบน — ลบรูปที่ไม่ต้องการได้โดยวางเมาส์แล้วกด ✕"
                    )
                  : t("High-res JPG or PNG, max 10MB each", "ไฟล์ JPG หรือ PNG ความละเอียดสูง ไม่เกิน 10MB ต่อรูป")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("draft")}
              className="btn-secondary"
            >
              {isPending && pendingIntent === "draft" ? t("Saving...", "กำลังบันทึก...") : t("Save Draft", "บันทึกฉบับร่าง")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("post")}
              className="btn-primary"
            >
              {isPending && pendingIntent === "post"
                ? t("Posting...", "กำลังโพสต์...")
                : t("Post Update & Notify Client", "โพสต์อัปเดตและแจ้งลูกค้า")}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-1">{t("Recent Status Updates", "อัปเดตสถานะล่าสุด")}</h2>
        <p className="text-xs text-gray-400 mb-4">
          {clientId || projectId
            ? t(
                `Showing history for ${[clientQuery || null, selectedProjectName].filter(Boolean).join(" · ")} — drafts are editable, posted updates are locked.`,
                `ประวัติของ ${[clientQuery || null, selectedProjectName].filter(Boolean).join(" · ")} — ฉบับร่างแก้ไขได้ อัปเดตที่โพสต์แล้วแก้ไขไม่ได้`
              )
            : t("Select a client or project above to see its update history.", "เลือกลูกค้าหรือโครงการด้านบนเพื่อดูประวัติการอัปเดต")}
        </p>

        {(clientId || projectId) && filteredUpdates.length === 0 ? (
          <p className="text-sm text-gray-400">{t("No updates posted yet for this selection.", "ยังไม่มีการอัปเดตสำหรับรายการที่เลือก")}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUpdates.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => (u.isDraft ? startEdit(u) : setSelectedUpdate(u))}
                className="w-full py-4 flex flex-wrap items-start justify-between gap-3 text-left hover:bg-gray-50 transition rounded-lg px-2 -mx-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{new Date(u.createdAt).toLocaleDateString(locale)}</span>
                    <span className={`badge ${statusBadgeClass(u.status)}`}>
                      {statusLabel(u.status, t)}
                    </span>
                    {u.isDraft && (
                      <span className="badge bg-amber-100 text-amber-700">
                        {t("Draft — click to edit", "ฉบับร่าง — คลิกเพื่อแก้ไข")}
                      </span>
                    )}
                    {u.photos.length > 0 && (
                      <span className="text-gray-400">
                        {t(`${u.photos.length} photo${u.photos.length > 1 ? "s" : ""}`, `${u.photos.length} รูป`)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">
                    {u.projectName ?? u.clientName ?? t("Update", "อัปเดต")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 max-w-2xl line-clamp-2">{u.notes}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{t("Completion", "ความคืบหน้า")}</p>
                  <p className="text-sm font-bold text-sky-700">{u.percentComplete}%</p>
                  <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${u.percentComplete}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUpdate && (
        <div
          onClick={() => setSelectedUpdate(null)}
          className="modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(selectedUpdate.createdAt).toLocaleDateString(locale)}</span>
                  <span
                    className={`badge ${statusBadgeClass(selectedUpdate.status)}`}
                  >
                    {statusLabel(selectedUpdate.status, t)}
                  </span>
                </div>
                <h3 className="section-title mt-1">
                  {selectedUpdate.projectName ?? selectedUpdate.clientName ?? t("Update", "อัปเดต")}
                </h3>
                {selectedUpdate.clientName && selectedUpdate.projectName && (
                  <p className="text-xs text-gray-400 mt-0.5">{t("Client: ", "ลูกค้า: ")}{selectedUpdate.clientName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedUpdate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition shrink-0"
                aria-label={t("Close", "ปิด")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs bg-gray-50 text-gray-500 rounded-xl px-3 py-2">
                {t(
                  "This update has been posted to the client and can no longer be edited. Post a follow-up update instead if something needs correcting.",
                  "อัปเดตนี้โพสต์ให้ลูกค้าแล้วและแก้ไขไม่ได้ หากต้องการแก้ไข กรุณาโพสต์อัปเดตใหม่แทน"
                )}
              </p>

              <div>
                <p className="label">
                  {t("Completion", "ความคืบหน้า")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600"
                      style={{ width: `${selectedUpdate.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-sky-700">
                    {selectedUpdate.percentComplete}%
                  </span>
                </div>
              </div>

              <div>
                <p className="label">
                  {t("Detail Notes", "รายละเอียดความคืบหน้า")}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedUpdate.notes}</p>
              </div>

              {selectedUpdate.photos.length > 0 && (
                <div>
                  <p className="label">
                    {t("Photos", "รูปภาพ")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUpdate.photos.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt={t("Progress photo", "รูปภาพความคืบหน้า")}
                          className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
