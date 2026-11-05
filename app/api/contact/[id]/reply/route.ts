import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getT } from "@/lib/i18n-server"
import { mailConfigured, sendMail } from "@/lib/mail"

// Saves the reply (the client sees it on My Messages) and, if asked, also
// emails it. The reply is saved even when the email fails, so it's never lost.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = await getT()
  const { id } = await params
  const { message, sendEmail } = await req.json()

  if (!message || !message.trim()) {
    return NextResponse.json({ error: t("Reply message is required.", "กรุณาพิมพ์ข้อความตอบกลับ") }, { status: 400 })
  }

  const contact = await prisma.contactForm.findUnique({ where: { id: Number(id) } })

  if (!contact) {
    return NextResponse.json({ error: t("Message not found.", "ไม่พบข้อความ") }, { status: 404 })
  }

  if (sendEmail && !mailConfigured()) {
    return NextResponse.json(
      {
        error: t(
          "Email sending isn't set up yet (SMTP_USER / SMTP_PASS missing in the admin .env). Use “Save Reply” for now.",
          "ยังไม่ได้ตั้งค่าการส่งอีเมล (ไม่มี SMTP_USER / SMTP_PASS ในไฟล์ .env ของแอดมิน) กรุณาใช้ “บันทึกการตอบกลับ” ไปก่อน"
        ),
      },
      { status: 503 }
    )
  }

  const updated = await prisma.contactForm.update({
    where: { id: Number(id) },
    data: { reply: message, repliedAt: new Date() },
  })

  if (!sendEmail) return NextResponse.json({ contact: updated, emailSent: false })

  try {
    await sendMail({
      to: contact.email,
      subject: t("Re: your message to UTO Advance Engineering", "ตอบกลับ: ข้อความของคุณถึง UTO Advance Engineering"),
      text: [
        t(`Dear ${contact.name},`, `เรียน คุณ${contact.name}`),
        "",
        message.trim(),
        "",
        "— UTO Advance Engineering",
        "",
        "------------------------------",
        t("Your original message:", "ข้อความของคุณ:"),
        contact.message,
      ].join("\n"),
    })
  } catch (error) {
    console.error("Send Reply Email Error:", error)
    return NextResponse.json(
      {
        contact: updated,
        emailSent: false,
        error: t(
          "The reply was saved, but the email couldn't be sent. Check the email settings and try again.",
          "บันทึกการตอบกลับแล้ว แต่ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอีเมลแล้วลองใหม่"
        ),
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ contact: updated, emailSent: true })
}
