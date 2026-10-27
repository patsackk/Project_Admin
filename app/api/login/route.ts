import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getT } from "@/lib/i18n-server"
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth"

export async function POST(req: Request) {
  const t = await getT()
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: t("Email and password are required.", "กรุณากรอกอีเมลและรหัสผ่าน") },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: t("Invalid email or password.", "อีเมลหรือรหัสผ่านไม่ถูกต้อง") },
        { status: 401 }
      )
    }

    // Client accounts (created via public /register) have no password at
    // all — check role first so that never reaches bcrypt.
    if (user.role !== "admin" || !user.password) {
      return NextResponse.json(
        { message: t("This account does not have access to the admin dashboard.", "บัญชีนี้ไม่มีสิทธิ์เข้าใช้แดชบอร์ดผู้ดูแล") },
        { status: 403 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: t("Invalid email or password.", "อีเมลหรือรหัสผ่านไม่ถูกต้อง") },
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
        message: t("Login successful!", "เข้าสู่ระบบสำเร็จ!"),
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 200 }
    )

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)

    return response
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json(
      { message: t("An error occurred during login.", "เกิดข้อผิดพลาดระหว่างการเข้าสู่ระบบ") },
      { status: 500 }
    )
  }
}
