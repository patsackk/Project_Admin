"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import ProjectSelect from "@/components/ProjectSelect"
import EditProjectButton from "@/components/EditProjectButton"
import type { ProjectOption } from "@/components/ProjectSelect"
import type { ClientRow } from "@/lib/client-types"

export default function ClientDetailPage() {
  const params = useParams() // ✅ get dynamic route param
  const id = params?.id

  const [client, setClient] = useState<ClientRow | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [projectId, setProjectId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  useEffect(() => {
    if (!id) return
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(t("Failed to fetch client", "โหลดข้อมูลลูกค้าไม่สำเร็จ"))
        return res.json()
      })
      .then((data) => {
        setClient(data)
        setProjectId(data.projectId ? String(data.projectId) : "")
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || t("Something went wrong", "เกิดข้อผิดพลาด"))
        setLoading(false)
      })

    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` only affects error text
  }, [id])

  const handleUpdate = async () => {
  try {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: projectId ? Number(projectId) : null }),
    })
    if (!res.ok) throw new Error(t("Update failed", "บันทึกไม่สำเร็จ"))
    const updated = await res.json()

    setClient((prev) => prev && {
      ...prev,
      projectId: updated.projectId,
      project: updated.project,
      location: updated.location,
    })

    toast.success(t("Saved successfully!", "บันทึกเรียบร้อยแล้ว!"))
  } catch (err) {
    toast.error((err as Error).message || t("Update error", "เกิดข้อผิดพลาดในการบันทึก"))
  }
}

  const selectedProject = projects.find((p) => String(p.id) === projectId)

  if (loading) return <p className="page empty-state">{t("Loading...", "กำลังโหลด...")}</p>
  if (error) return <div className="page"><p className="alert-error">{error}</p></div>
  if (!client) return <p className="page empty-state">{t("No client found", "ไม่พบลูกค้า")}</p>

  return (
    <div className="page max-w-3xl">
      <Link href="/clients" className="back-link">
        <ArrowLeft size={16} />
        {t("Back to Clients", "กลับไปหน้าลูกค้า")}
      </Link>

      <div className="card p-8 space-y-6">
        {/* Header */}
        <h1 className="page-title">{client.user?.name}</h1>

        {/* User Info */}
        <div className="rounded-xl bg-gray-50 p-4 space-y-1 text-sm text-gray-700">
          <p><span className="font-semibold">{t("Email:", "อีเมล:")}</span> {client.user?.email || "-"}</p>
          <p><span className="font-semibold">{t("Phone:", "โทรศัพท์:")}</span> {client.user?.phone || "-"}</p>
          <p><span className="font-semibold">{t("Address:", "ที่อยู่:")}</span> {client.user?.address || "-"}</p>
        </div>

        {/* Update Form */}
        <div className="space-y-5">
          <div>
            <label htmlFor="projectId" className="label">{t("Project", "โครงการ")}</label>
            <ProjectSelect
              id="projectId"
              value={projectId}
              onChange={setProjectId}
              projects={projects}
              onCreated={(p) => setProjects((prev) => [...prev, p])}
            />
            {selectedProject && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                <span>
                  {t("Location: ", "สถานที่: ")}
                  <span className="font-medium text-gray-700">{selectedProject.location || "-"}</span>
                </span>
                <EditProjectButton
                  project={selectedProject}
                  onSaved={(p) => {
                    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)))
                    setClient((prev) => (prev?.projectId === p.id ? { ...prev, project: p, location: p.location } : prev))
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/clients" className="btn-secondary">
              {t("Cancel", "ยกเลิก")}
            </Link>
            <button onClick={handleUpdate} className="btn-primary">
              {t("Save Changes", "บันทึกการเปลี่ยนแปลง")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
