"use client"

import { useEffect, useState } from "react"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [search, setSearch] = useState("")

  // Fetch clients
  const fetchClients = async () => {
    const res = await fetch("/api/clients", { cache: "no-store" })
    const data = await res.json()
    setClients(data)
  }

  // Fetch users
  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const data = await res.json()
    setUsers(data)
  }

  // Fetch projects
  const fetchProjects = async () => {
    const res = await fetch("/api/projects")
    const data = await res.json()
    setProjects(data)
  }

  useEffect(() => {
    fetchClients()
    fetchUsers()
    fetchProjects()
  }, [])

  // Handle create
  const handleCreate = async () => {
    if (!selectedUserId) return window.alert("Select user first")

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(selectedUserId),
          location: "Add Location",
          projectId: selectedProjectId ? Number(selectedProjectId) : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to add client")
      const newClient = await res.json()
      setClients((prev) => [...prev, newClient])
      setSelectedUserId("")
      setSelectedProjectId("")
      setSuccessMessage("Client added successfully!")
      setTimeout(() => setSuccessMessage(""), 2000)
    } catch (err: any) {
      window.alert(err.message)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this client?")
    if (!confirmed) return

    try {
      const res = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setClients((prev) => prev.filter((c) => c.id !== id))
      setSuccessMessage("Client deleted successfully!")
      setTimeout(() => setSuccessMessage(""), 2000)
    } catch (err: any) {
      window.alert(err.message)
    }
  }

  // Filter clients by search
  const filteredClients = search
    ? clients.filter((c) =>
        c.user?.name.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const handleDone = async (client: any) => {
  const confirmed = window.confirm("Mark this project as done?")
  if (!confirmed) return

  try {
    // 1. Save to history
    await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: client.userId,
        projectName: client.project?.name ?? "No Project",
        location: client.location,
      }),
    })

    // 2. Delete client
    await fetch("/api/clients", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: client.id }),
    })

    // 3. Update UI
    setClients((prev) => prev.filter((c) => c.id !== client.id))

    setSuccessMessage("Project marked as done!")
    setTimeout(() => setSuccessMessage(""), 2000)
  } catch (err: any) {
    alert(err.message)
  }
}

  return (
    <div className="p-6 space-y-6 relative w-full lg:max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-semibold">Client Information</h1>

      {/* Success alert */}
      {successMessage && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow">
          {successMessage}
        </div>
      )}

      {/* Search bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by client name..."
        className="border p-2 w-full sm:max-w-md rounded mb-4"
      />

      {/* select + add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="border px-3 py-2 rounded-lg flex-1"
        >
          <option value="">Select Client</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="border px-3 py-2 rounded-lg flex-1"
        >
          <option value="">No Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
        >
          + Add Client
        </button>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((c) => (
          <div
            key={c.id}
            className="relative group p-6 bg-white border rounded-2xl shadow hover:shadow-xl hover:scale-105 transition"
          >
            <h2 className="font-bold text-lg">{c.user?.name}</h2>
            <p className="mt-1 text-sm">
              Project: <span className="font-semibold">{c.project?.name ?? "No Project"}</span>
            </p>
            <p className="text-sm text-gray-600">
              Location: {c.location}
            </p>
        

            {/* Buttons at bottom */}
            <div className="mt-4 flex gap-2">
            <a
              href={`/clients/${c.id}`}
              className="flex-1 bg-blue-500 text-white text-center text-sm px-2 py-1 rounded hover:bg-blue-600 transition"
            >
              View Details
            </a>

            <button
              onClick={() => handleDone(c)}
              className="flex-1 bg-green-500 text-white text-sm px-2 py-1 rounded hover:bg-green-600 transition"
            >
              Done
            </button>

            <button
              onClick={() => handleDelete(c.id)}
              className="flex-1 bg-red-500 text-white text-sm px-2 py-1 rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>

            {/* HOVER POPUP */}
            <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gray-800/70 text-white text-xs p-3 rounded-xl top-2 right-2 w-52 shadow-lg pointer-events-none group-hover:pointer-events-auto">
              <p>Email: {c.user?.email}</p>
              <p>Phone: {c.user?.phone || "-"}</p>
              <p>Location: {c.location}</p>
              <p>Address: {c.user?.address || "-"}</p>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <p className="text-gray-500 col-span-full">No client found.</p>
        )}
      </div>
    </div>
  )
}