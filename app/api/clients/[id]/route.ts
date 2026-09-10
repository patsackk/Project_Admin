import { prisma } from "@/lib/prisma"

// GET single client
export async function GET(req: Request, { params }: any) {
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
export async function PUT(req: Request, { params }: any) {
  const { id } = await params // ✅ await params
  const body = await req.json()

  const updated = await prisma.client.update({
    where: { id: Number(id) },
    data: {
      location: body.location,
      projectId: body.projectId ?? null,
    },
    include: { project: true },
  })

  return Response.json(updated)
}

// DELETE
export async function DELETE(req: Request, { params }: any) {
  const { id } = await params // ✅ await params

  await prisma.client.delete({
    where: { id: Number(id) },
  })

  return Response.json({ message: "Deleted" })
}