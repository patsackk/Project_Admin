import { prisma } from "@/lib/prisma"
import StatusUpdateForm from "@/components/StatusUpdateForm"
import { getT } from "@/lib/i18n-server"

export default async function StatusPage() {
  const t = await getT()
  const [clients, projects, updates] = await Promise.all([
    prisma.client.findMany({ include: { user: true } }),
    prisma.project.findMany(),
    prisma.statusUpdate.findMany({
      include: { client: { include: { user: true } }, project: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: c.user?.name ?? t(`Client #${c.id}`, `ลูกค้า #${c.id}`),
    projectId: c.projectId,
  }))

  const updateOptions = updates.map((u) => ({
    id: u.id,
    clientId: u.clientId,
    clientName: u.client?.user?.name ?? null,
    projectId: u.projectId,
    projectName: u.project?.name ?? null,
    status: u.status,
    percentComplete: u.percentComplete,
    notes: u.notes,
    photos: u.photos,
    isDraft: u.isDraft,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Update Status", "อัปเดตสถานะงาน")}</h1>
        <p className="page-subtitle">
          {t(
            "Post a new progress update for your client and project milestones.",
            "โพสต์ความคืบหน้าล่าสุดของงานให้ลูกค้า และอัปเดตเป้าหมายของโครงการ"
          )}
        </p>
      </div>

      <StatusUpdateForm clients={clientOptions} projects={projects} updates={updateOptions} />
    </div>
  )
}
