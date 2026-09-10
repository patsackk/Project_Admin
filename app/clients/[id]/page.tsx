"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ClientDetailPage() {
  const params = useParams() // ✅ get dynamic route param
  const id = params?.id
  const router = useRouter() // <-- for navigation

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

    alert("Saved Successfully!")
  } catch (err: any) {
    alert(err.message || "Update error")
  }
}

  const handleBack = () => {
    router.push("/clients") // <-- go back to client CRUD/list page
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!client) return <p>No client found</p>

  return (
  <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-20">
  <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-8 space-y-6">
    {/* Header */}
    <h1 className="text-2xl font-bold text-gray-800 text-center">{client.user?.name}</h1>

    {/* User Info Card */}
<div className="bg-gray-50 p-4 rounded-lg shadow-inner space-y-2">
  <p><span className="font-semibold">Email:</span> {client.user?.email || "-"}</p>
  <p><span className="font-semibold">Phone:</span> {client.user?.phone || "-"}</p>
  <p><span className="font-semibold">Address:</span> {client.user?.address || "-"}</p>
</div>

    {/* Update Form */}
    <div className="space-y-4">
      <div className="flex flex-col">
        <label htmlFor="projectId" className="text-gray-600 font-medium mb-1">
          Project
        </label>
        <select
          id="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">No Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="location" className="text-gray-600 font-medium mb-1">
          Location
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="Enter location"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleUpdate}
          className="flex-1 bg-blue-500 text-white text-sm px-2 py-2 rounded hover:bg-blue-600 transition font-semibold shadow"
        >
          Update
        </button>
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-300 text-gray-800 text-sm px-2 py-2 rounded hover:bg-gray-400 transition font-semibold shadow"
        >
          Back
        </button>
      </div>
    </div>
  </div>
  </div>
)
}