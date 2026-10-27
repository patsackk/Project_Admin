"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useLanguage } from "@/components/LanguageProvider"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [search, setSearch] = useState("")
  const [canDelete, setCanDelete] = useState(false)
  const [canMarkDone, setCanMarkDone] = useState(false)
  const { t } = useLanguage()

  // Fetch current session (Admin vs Staff) to decide which actions to show
  const fetchSession = async () => {
    const res = await fetch("/api/session", { cache: "no-store" })
    const data = await res.json()
    setCanDelete(!!data.permissions?.deleteClient)
    setCanMarkDone(!!data.permissions?.markClientDone)
  }

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
    fetchSession()
    fetchClients()
    fetchUsers()
    fetchProjects()

    // Re-check the session whenever it changes elsewhere (e.g. switching
    // role on /choose-role) so the Delete/Done buttons stay accurate.
    window.addEventListener('storage', fetchSession)
    window.addEventListener('focus', fetchSession)
    return () => {
      window.removeEventListener('storage', fetchSession)
      window.removeEventListener('focus', fetchSession)
    }
  }, [])

  // Handle create
  const handleCreate = async () => {
    if (!selectedUserId) return toast.error(t("Select a client first", "กรุณาเลือกลูกค้าก่อน"))

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
      if (!res.ok) throw new Error(t("Failed to add client", "เพิ่มลูกค้าไม่สำเร็จ"))
      const newClient = await res.json()
      setClients((prev) => [...prev, newClient])
      setSelectedUserId("")
      setSelectedProjectId("")
      toast.success(t("Client added successfully!", "เพิ่มลูกค้าเรียบร้อยแล้ว!"))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(t("Are you sure you want to delete this client?", "ต้องการลบลูกค้ารายนี้ใช่หรือไม่?"))
    if (!confirmed) return

    try {
      const res = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setClients((prev) => prev.filter((c) => c.id !== id))
      toast.success(t("Client deleted successfully!", "ลบลูกค้าเรียบร้อยแล้ว!"))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Filter clients by search
  const filteredClients = search
    ? clients.filter((c) =>
        c.user?.name.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const handleDone = async (client: any) => {
  const confirmed = window.confirm(t("Mark this project as done?", "ทำเครื่องหมายว่าโครงการนี้เสร็จสิ้นแล้วใช่หรือไม่?"))
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
      body: JSON.stringify({ id: client.id, action: "done" }),
    })

    // 3. Update UI
    setClients((prev) => prev.filter((c) => c.id !== client.id))

    toast.success(t("Project marked as done!", "ทำเครื่องหมายโครงการว่าเสร็จสิ้นแล้ว!"))
  } catch (err: any) {
    toast.error(err.message)
  }
}

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Client Information", "ข้อมูลลูกค้า")}</h1>
        <p className="page-subtitle">{t("Link registered users to a project and track them until it is done.", "เชื่อมผู้ใช้ที่ลงทะเบียนเข้ากับโครงการ และติดตามจนกว่าโครงการจะเสร็จสิ้น")}</p>
      </div>

      {/* select + add */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input flex-1"
        >
          <option value="">{t("Select Client", "เลือกลูกค้า")}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="input flex-1"
        >
          <option value="">{t("No Project", "ไม่มีโครงการ")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          className="btn-primary w-full sm:w-auto"
        >
          {t("+ Add Client", "+ เพิ่มลูกค้า")}
        </button>
      </div>

      {/* Search bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("Search by client name...", "ค้นหาด้วยชื่อลูกค้า...")}
        className="input sm:max-w-md"
      />

      {/* cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((c) => (
          <div
            key={c.id}
            className="card relative group p-6 transition hover:shadow-lg"
          >
            <h2 className="font-semibold text-lg text-gray-900">{c.user?.name}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("Project: ", "โครงการ: ")}<span className="font-semibold">{c.project?.name ?? t("No Project", "ไม่มีโครงการ")}</span>
            </p>
            <p className="text-sm text-gray-600">
              {t("Location: ", "สถานที่: ")}{c.location}
            </p>
        

            {/* Buttons at bottom */}
            <div className="mt-4 flex gap-2">
            <Link
              href={`/clients/${c.id}`}
              className="btn-primary flex-1 px-3 py-1.5"
            >
              {t("View Details", "ดูรายละเอียด")}
            </Link>

            {canMarkDone && (
              <button
                onClick={() => handleDone(c)}
                className="btn-secondary flex-1 px-3 py-1.5"
              >
                {t("Done", "เสร็จสิ้น")}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => handleDelete(c.id)}
                className="btn-danger flex-1 px-3 py-1.5"
              >
                {t("Delete", "ลบ")}
              </button>
            )}
          </div>

            {/* HOVER POPUP */}
            <div className="absolute opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gray-900/80 text-white text-xs p-3 rounded-xl top-2 right-2 w-52 shadow-lg pointer-events-none group-hover:pointer-events-auto">
              <p>{t("Email: ", "อีเมล: ")}{c.user?.email}</p>
              <p>{t("Phone: ", "โทรศัพท์: ")}{c.user?.phone || "-"}</p>
              <p>{t("Location: ", "สถานที่: ")}{c.location}</p>
              <p>{t("Address: ", "ที่อยู่: ")}{c.user?.address || "-"}</p>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <p className="card empty-state col-span-full">{t("No client found.", "ไม่พบลูกค้า")}</p>
        )}
      </div>
    </div>
  )
}