import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

const SESSION_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // 8 hours

export const SESSION_COOKIE = "session"

// "level" is chosen after login (see /choose-role) and controls what an
// admin-role account is permitted to do for the rest of the session.
export type AccessLevel = "admin" | "staff"

export type SessionPayload = {
  sub: string
  email: string
  name: string
  role: string
  level?: AccessLevel
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(SESSION_SECRET)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
}

// Read-only session lookup for Server Components, Route Handlers, and
// Server Actions (anywhere `next/headers` cookies() is available).
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
