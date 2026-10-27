import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Admin notifications: contact messages that haven't been replied to yet.
// The count stays until someone replies, so it reflects outstanding work
// rather than "unseen" items.
export async function GET() {
  const where = { reply: null }

  const [count, messages] = await Promise.all([
    prisma.contactForm.count({ where }),
    prisma.contactForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, message: true, createdAt: true },
    }),
  ])

  const response = NextResponse.json({ count, messages })
  response.headers.set("Cache-Control", "no-store")
  return response
}
