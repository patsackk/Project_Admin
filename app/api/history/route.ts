import { prisma } from "@/lib/prisma"

// GET all history
export async function GET() {
  const history = await prisma.history.findMany({
    include: { user: true },
    orderBy: { completedAt: "desc" },
  })
  return Response.json(history)
}

// Projects are added to History by "Done" on the Clients page — see DELETE
// in ../clients/route.ts, which does it together with removing the client.