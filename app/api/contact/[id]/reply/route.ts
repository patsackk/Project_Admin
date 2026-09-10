import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { message } = await req.json()

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Reply message is required." }, { status: 400 })
  }

  const contact = await prisma.contactForm.findUnique({ where: { id: Number(id) } })

  if (!contact) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 })
  }

  const updated = await prisma.contactForm.update({
    where: { id: Number(id) },
    data: { reply: message, repliedAt: new Date() },
  })

  return NextResponse.json(updated)
}
