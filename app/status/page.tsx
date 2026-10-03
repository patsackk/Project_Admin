import { prisma } from "@/lib/prisma"
import StatusUpdateForm from "@/components/StatusUpdateForm"

export default async function StatusPage() {
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
    name: c.user?.name ?? `Client #${c.id}`,
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
        <h1 className="page-title">Update Status</h1>
        <p className="page-subtitle">
          Post a new progress update for your client and project milestones.
        </p>
      </div>

      <StatusUpdateForm clients={clientOptions} projects={projects} updates={updateOptions} />
    </div>
  )
}
