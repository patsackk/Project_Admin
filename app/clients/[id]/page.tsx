"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

export default function ClientDetailPage() {
  const params = useParams() // ✅ get dynamic route param
  const id = params?.id

  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState("")
  const [location, setLocation] = useState("")
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
        setLocation(data.location)
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
      body: JSON.stringify({ projectId: projectId ? Number(projectId) : null, location }),
    })
    if (!res.ok) throw new Error(t("Update failed", "บันทึกไม่สำเร็จ"))
    const updated = await res.json()

    setClient((prev: any) => ({
      ...prev,
      project: updated.project,
      location,
      updatedAt: new Date().toISOString(), // optional: show last updated time
    }))

    toast.success(t("Saved successfully!", "บันทึกเรียบร้อยแล้ว!"))
  } catch (err: any) {
    toast.error(err.message || t("Update error", "เกิดข้อผิดพลาดในการบันทึก"))
  }
}

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
            <select
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input"
            >
              <option value="">{t("No Project", "ไม่มีโครงการ")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="label">{t("Location", "สถานที่")}</label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder={t("Enter location", "กรอกสถานที่")}
            />
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
