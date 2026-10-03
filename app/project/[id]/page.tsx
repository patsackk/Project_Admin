"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id

  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    const fetchProject = async () => {
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      setProject(data)
    }

    if (id) fetchProject()
  }, [id])

  if (!project) return <p className="page empty-state">Loading...</p>

  return (
    <div className="page">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Dashboard
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
        <h2 className="section-title p-6 pb-4">Schedule Table</h2>

        {project.schedules.length === 0 ? (
          <p className="empty-state">No schedules</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Team</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {project.schedules.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-medium text-gray-900">{s.worker.name}</td>
                  <td>{s.worker.team}</td>
                  <td>
                    {new Date(s.date).toLocaleDateString()}
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