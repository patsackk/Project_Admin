import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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