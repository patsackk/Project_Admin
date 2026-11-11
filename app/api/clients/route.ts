import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"

// GET
export async function GET() {
  const clients = await prisma.client.findMany({
    include: { user: true, project: true },
  })
  return Response.json(clients)
}

// POST
// Location lives on the project; the client's copy just follows it (History
// and the assistant still read it from the client row).
export async function POST(req: Request) {
  const body = await req.json()
  const projectId = body.projectId ? Number(body.projectId) : null
  const project = projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null

  const client = await prisma.client.create({
    data: {
      userId: body.userId,
      location: project?.location ?? "",
      projectId,
    },
    include: { user: true, project: true },
  })

  return Response.json(client)
}

// DELETE (Admin only, unless granted to Staff via /permissions).
// `action` distinguishes an outright delete from "mark done" (which archives
// the client to History first, in the same transaction) since they're
// independently toggleable permissions.
export async function DELETE(req: Request) {
  const t = await getT()
  const { id, action } = await req.json()
  const permissionKey = action === "done" ? "markClientDone" : "deleteClient"

  if (!(await hasAccess(permissionKey))) {
    return Response.json(
      { success: false, message: t("You don't have permission to do that.", "คุณไม่มีสิทธิ์ทำรายการนี้") },
      { status: 403 }
    )
  }

  try {
    const deletedClient = await prisma.$transaction(async (tx) => {
      const client = await tx.client.findUniqueOrThrow({
        where: { id: Number(id) },
        include: { project: true },
      })
      if (action === "done") {
        await tx.history.create({
          data: {
            userId: client.userId,
            projectName: client.project?.name ?? "No Project",
            // Same rule as the Clients page: the project's location wins.
            location: client.project?.location || (client.location !== "Add Location" ? client.location : "") || "-",
          },
        })
      }
      return tx.client.delete({ where: { id: client.id } })
    })

    return Response.json({ success: true, client: deletedClient })
  } catch (err) {
    console.error("Delete client error:", err)
    return Response.json({ success: false, message: t("Something went wrong. Please try again.", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง") }, { status: 500 })
  }
}