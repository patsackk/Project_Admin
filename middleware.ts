import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth"

const PUBLIC_PATHS = new Set(["/login", "/register"])

const PUBLIC_PREFIXES = [
  "/services",
  "/images",
  "/api/login",
  "/api/register",
  "/api/contact",
]

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (!session || session.role !== "admin") {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in, but hasn't picked Admin/Staff for this session yet. These
  // paths must stay reachable without a level: the picker page itself, the
  // endpoint that sets the level, and logout.
  const levelExempt =
    pathname === "/choose-role" ||
    pathname === "/api/logout" ||
    pathname.startsWith("/api/session")

  if (!session.level && !levelExempt) {
    return NextResponse.redirect(new URL("/choose-role", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
