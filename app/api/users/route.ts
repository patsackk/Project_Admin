import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Never send password hashes to the browser.
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, address: true },
    })
    return Response.json(users)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "DB error" }, { status: 500 })
  }
}