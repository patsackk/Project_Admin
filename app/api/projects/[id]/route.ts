import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      schedules: {
        include: {
          worker: true
        }
      }
    }
  })

  return NextResponse.json(project)
}