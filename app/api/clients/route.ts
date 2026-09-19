import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"

// GET
export async function GET() {
  const clients = await prisma.client.findMany({
    include: { user: true, project: true },
  })
  return Response.json(clients)
}

// POST
export async function POST(req: Request) {
  const body = await req.json()

  const client = await prisma.client.create({
    data: {
      userId: body.userId,
      location: body.location,
      projectId: body.projectId ?? null,
    },
    include: { user: true, project: true },
  })

  return Response.json(client)
}

// DELETE (Admin only, unless granted to Staff via /permissions).
// `action` distinguishes an outright delete from "mark done" (which also
// deletes the client row, after archiving to History) since they're
// independently toggleable permissions.
export async function DELETE(req: Request) {
  const { id, action } = await req.json()
  const permissionKey = action === "done" ? "markClientDone" : "deleteClient"

  if (!(await hasAccess(permissionKey))) {
    return Response.json(
      { success: false, message: "You don't have permission to do that." },
      { status: 403 }
    )
  }

  try {
    const deletedClient = await prisma.client.delete({
      where: { id: Number(id) },
    })

    return Response.json({ success: true, client: deletedClient })
  } catch (err: any) {
    return Response.json({ success: false, message: err.message }, { status: 500 })
  }
}