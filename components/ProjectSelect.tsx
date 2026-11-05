"use client"

import { useState, useTransition } from "react"
import toast from "react-hot-toast"
import { Plus, X } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import Tooltip from "@/components/Tooltip"
import { createProject } from "@/app/actions"

export type ProjectOption = { id: number; name: string; location: string }

const NEW = "__new__"

// Project dropdown with a "+ New project…" choice that creates the project
// on the spot (no trip to the Schedule page) and selects it.
export default function ProjectSelect({
  id,
  value,
  onChange,
  projects,
  onCreated,
  className = "",
}: {
  id?: string
  value: string
  onChange: (projectId: string) => void
  projects: ProjectOption[]
  onCreated: (project: ProjectOption) => void
  className?: string
}) {
  const { t } = useLanguage()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [pending, startTransition] = useTransition()

  const create = () =>
    startTransition(async () => {
      const result = await createProject(name, location)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      onCreated(result.project)
      onChange(String(result.project.id))
      toast.success(t(`Project “${result.project.name}” added`, `เพิ่มโครงการ “${result.project.name}” แล้ว`))
      setCreating(false)
      setName("")
      setLocation("")
    })

  if (creating) {
    return (
      <div className={`flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/60 p-2 sm:flex-row ${className}`}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && create()}
          placeholder={t("New project name", "ชื่อโครงการใหม่")}
          className="input min-w-0 flex-1"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && create()}
          placeholder={t("Location", "สถานที่")}
          className="input min-w-0 flex-1"
        />
        <div className="flex gap-1">
          <button type="button" onClick={create} disabled={pending || !name.trim()} className="btn-primary px-4">
            <Plus size={16} /> {pending ? t("Adding…", "กำลังเพิ่ม…") : t("Add", "เพิ่ม")}
          </button>
          <Tooltip label={t("Cancel", "ยกเลิก")}>
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost px-2" aria-label={t("Cancel", "ยกเลิก")}>
              <X size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => (e.target.value === NEW ? setCreating(true) : onChange(e.target.value))}
      className={`input ${className}`}
    >
      <option value="">{t("No Project", "ไม่มีโครงการ")}</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
          {p.location && ` — ${p.location}`}
        </option>
      ))}
      <option value={NEW}>{t("+ New project…", "+ สร้างโครงการใหม่…")}</option>
    </select>
  )
}
