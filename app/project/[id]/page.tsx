"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

type ProjectDetail = {
  id: number
  name: string
  location: string
  schedules: {
    id: number
    date: string
    startTime: string
    endTime: string
    worker: { name: string; team: string }
  }[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id

  // undefined while loading, null when there's no project with this id
  const [project, setProject] = useState<ProjectDetail | null | undefined>(undefined)
  const { t, locale } = useLanguage()

  useEffect(() => {
    const fetchProject = async () => {
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      setProject(data)
    }

    if (id) fetchProject()
  }, [id])

  if (project === undefined) return <p className="page empty-state">{t("Loading...", "กำลังโหลด...")}</p>
  if (project === null) return <p className="page empty-state">{t("Project not found.", "ไม่พบโครงการ")}</p>

  return (
    <div className="page">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} />
        {t("Back to Dashboard", "กลับไปแดชบอร์ด")}
      </Link>

      {/* HEADER */}
      <div className="card p-6">
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle flex items-center gap-1">
          <MapPin size={14} />
          {project.location}
        </p>
      </div>

      {/* TABLE */}
      <div className="card overflow-hidden">
        <h2 className="section-title p-6 pb-4">{t("Schedule Table", "ตารางงาน")}</h2>

        {project.schedules.length === 0 ? (
          <p className="empty-state">{t("No schedules", "ไม่มีตารางงาน")}</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Worker", "ผู้ปฏิบัติงาน")}</th>
                <th>{t("Team", "ทีม")}</th>
                <th>{t("Date", "วันที่")}</th>
                <th>{t("Time", "เวลา")}</th>
              </tr>
            </thead>

            <tbody>
              {project.schedules.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-gray-900">{s.worker.name}</td>
                  <td>{s.worker.team}</td>
                  <td>
                    {new Date(s.date).toLocaleDateString(locale)}
                  </td>
                  <td>
                    {s.startTime} - {s.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}