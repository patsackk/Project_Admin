"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useLanguage } from "@/components/LanguageProvider"
import { useDialog } from "@/components/DialogProvider"
import ProjectSelect from "@/components/ProjectSelect"

// A client is wherever their project is; the client's own location is only a
// fallback for rows saved before that rule.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientLocation = (c: any) => c.project?.location || (c.location !== "Add Location" && c.location) || "-"

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
  const dialog = useDialog()

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
    const confirmed = await dialog.confirm({
      title: t("Delete this client?", "ลบลูกค้ารายนี้?"),
      message: t(
        "They're removed from the list without being saved to History. Use “Done” instead when the job is finished.",
        "ลูกค้าจะถูกลบออกโดยไม่บันทึกลงประวัติ หากงานเสร็จแล้วให้กด “เสร็จสิ้น” แทน"
      ),
      danger: true,
    })
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

  // Only client accounts (not admins) that aren't on the list yet — a user
  // can be one client at a time.
  const linkedUserIds = new Set(clients.map((c) => c.userId))
  const availableUsers = users.filter((u) => u.role === "client" && !linkedUserIds.has(u.id))

  // Filter clients by search
  const filteredClients = search
    ? clients.filter((c) =>
        c.user?.name.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const handleDone = async (client: any) => {
  const confirmed = await dialog.confirm({
    title: t("Mark this project as done?", "ทำเครื่องหมายว่าโครงการนี้เสร็จสิ้นแล้ว?"),
    message: t(
      `${client.user?.name ?? "This client"} – ${client.project?.name ?? "no project"} moves to History.`,
      `${client.user?.name ?? "ลูกค้ารายนี้"} – ${client.project?.name ?? "ไม่มีโครงการ"} จะถูกย้ายไปที่ประวัติ`
    ),
    confirmLabel: t("Mark as done", "เสร็จสิ้น"),
  })
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
        location: clientLocation(client),
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
        <h1 className="page-title">{t("Clients", "ลูกค้า")}</h1>
        <p className="page-subtitle">{t("Link registered users to a project and track them until it is done.", "เชื่อมผู้ใช้ที่ลงทะเบียนเข้ากับโครงการ และติดตามจนกว่าโครงการจะเสร็จสิ้น")}</p>
      </div>

      {/* select + add */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input flex-1"
        >
          <option value="">
            {availableUsers.length > 0
              ? t("Select Client", "เลือกลูกค้า")
              : t("No registered clients left to add", "ไม่มีลูกค้าที่ลงทะเบียนแล้วเหลือให้เพิ่ม")}
          </option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.email}
            </option>
          ))}
        </select>

        <ProjectSelect
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          projects={projects}
          onCreated={(p) => setProjects((prev) => [...prev, p])}
          className="flex-1"
        />

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
              {t("Location: ", "สถานที่: ")}{clientLocation(c)}
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
              <p>{t("Location: ", "สถานที่: ")}{clientLocation(c)}</p>
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