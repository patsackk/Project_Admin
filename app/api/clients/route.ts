import { prisma } from "@/lib/prisma"

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

// DELETE
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() // we pass the client id from front-end

    const deletedClient = await prisma.client.delete({
      where: { id: Number(id) },
    })

    return Response.json({ success: true, client: deletedClient })
  } catch (err: any) {
    return Response.json({ success: false, message: err.message }, { status: 500 })
  }
}