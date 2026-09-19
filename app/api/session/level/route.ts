import { NextResponse } from "next/server"
import { createSessionToken, getSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getSession()

  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 })
  }

  const { level } = await req.json()

  if (level !== "admin" && level !== "staff") {
    return NextResponse.json({ message: "Invalid role." }, { status: 400 })
  }

  const token = await createSessionToken({
    sub: session.sub,
    email: session.email,
    name: session.name,
    role: session.role,
    level,
  })

  const response = NextResponse.json({ message: "Role set.", level })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
  return response
}
