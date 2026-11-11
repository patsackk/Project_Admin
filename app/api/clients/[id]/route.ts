import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"

type Params = { params: Promise<{ id: string }> }

// GET single client
export async function GET(req: Request, { params }: Params) {
  const { id } = await params // ✅ await params

  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: { user: true, project: true },
  })

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 })
  }

  return Response.json(client)
}

// UPDATE
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params // ✅ await params
  const body = await req.json()
  const projectId = body.projectId ? Number(body.projectId) : null
  const project = projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null

  // Location follows the project (see POST in ../route.ts).
  const updated = await prisma.client.update({
    where: { id: Number(id) },
    data: {
      location: project?.location ?? "",
      projectId,
    },
    include: { project: true },
  })

  return Response.json(updated)
}

// DELETE (Admin only, unless granted to Staff via /permissions — same rule
// as DELETE in ../route.ts)
export async function DELETE(req: Request, { params }: Params) {
  if (!(await hasAccess("deleteClient"))) {
    const t = await getT()
    return Response.json({ message: t("You don't have permission to do that.", "คุณไม่มีสิทธิ์ทำรายการนี้") }, { status: 403 })
  }

  const { id } = await params // ✅ await params

  await prisma.client.delete({
    where: { id: Number(id) },
  })

  return Response.json({ message: "Deleted" })
}