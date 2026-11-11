import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      schedules: true
    }
  })

  return NextResponse.json(projects)
}