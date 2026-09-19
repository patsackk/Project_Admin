import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      )
    }

    // Client accounts (created via public /register) have no password at
    // all — check role first so that never reaches bcrypt.
    if (user.role !== "admin" || !user.password) {
      return NextResponse.json(
        { message: "This account does not have access to the admin dashboard." },
        { status: 403 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      )
    }

    const token = await createSessionToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        message: "Login successful!",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 200 }
    )

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)

    return response
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json(
      { message: "An error occurred during login." },
      { status: 500 }
    )
  }
}
