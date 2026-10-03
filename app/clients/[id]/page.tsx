"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft } from "lucide-react"

export default function ClientDetailPage() {
  const params = useParams() // ✅ get dynamic route param
  const id = params?.id

  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState("")
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch client")
        return res.json()
      })
      .then((data) => {
        setClient(data)
        setProjectId(data.projectId ? String(data.projectId) : "")
        setLocation(data.location)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Something went wrong")
        setLoading(false)
      })

    fetch("/api/projects")
      .then((res) => res.json())
      .then(setProjects)
  }, [id])

  const handleUpdate = async () => {
  try {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: projectId ? Number(projectId) : null, location }),
    })
    if (!res.ok) throw new Error("Update failed")
    const updated = await res.json()

    setClient((prev: any) => ({
      ...prev,
      project: updated.project,
      location,
      updatedAt: new Date().toISOString(), // optional: show last updated time
    }))

    toast.success("Saved successfully!")
  } catch (err: any) {
    toast.error(err.message || "Update error")
  }
}

  if (loading) return <p className="page empty-state">Loading...</p>
  if (error) return <div className="page"><p className="alert-error">{error}</p></div>
  if (!client) return <p className="page empty-state">No client found</p>

  return (
    <div className="page max-w-3xl">
      <Link href="/clients" className="back-link">
        <ArrowLeft size={16} />
        Back to Clients
      </Link>

      <div className="card p-8 space-y-6">
        {/* Header */}
        <h1 className="page-title">{client.user?.name}</h1>

        {/* User Info */}
        <div className="rounded-xl bg-gray-50 p-4 space-y-1 text-sm text-gray-700">
          <p><span className="font-semibold">Email:</span> {client.user?.email || "-"}</p>
          <p><span className="font-semibold">Phone:</span> {client.user?.phone || "-"}</p>
          <p><span className="font-semibold">Address:</span> {client.user?.address || "-"}</p>
        </div>

        {/* Update Form */}
        <div className="space-y-5">
          <div>
            <label htmlFor="projectId" className="label">Project</label>
            <select
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input"
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="label">Location</label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="Enter location"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/clients" className="btn-secondary">
              Cancel
            </Link>
            <button onClick={handleUpdate} className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
