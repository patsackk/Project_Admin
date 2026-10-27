import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getT } from "@/lib/i18n-server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getT()
  const { id } = await params
  const { message } = await req.json()

  if (!message || !message.trim()) {
    return NextResponse.json({ error: t("Reply message is required.", "กรุณาพิมพ์ข้อความตอบกลับ") }, { status: 400 })
  }

  const contact = await prisma.contactForm.findUnique({ where: { id: Number(id) } })

  if (!contact) {
    return NextResponse.json({ error: t("Message not found.", "ไม่พบข้อความ") }, { status: 404 })
  }

  const updated = await prisma.contactForm.update({
    where: { id: Number(id) },
    data: { reply: message, repliedAt: new Date() },
  })

  return NextResponse.json(updated)
}
