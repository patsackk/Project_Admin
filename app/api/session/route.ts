import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getPermissions, PermissionFlags } from "@/lib/permissions"

// Always re-read the session cookie fresh — never let the browser or Next's
// cache serve a stale role after switching Admin/Staff.
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()

  let permissions: PermissionFlags | null = null
  if (session?.role === "admin") {
    permissions =
      session.level === "admin"
        ? { unassignSchedule: true, addProject: true, deleteProject: true, addWorker: true, deleteClient: true, markClientDone: true }
        : await getPermissions()
  }

  const response = session
    ? NextResponse.json({
        session: {
          name: session.name,
          email: session.email,
          role: session.role,
          level: session.level ?? null,
        },
        permissions,
      })
    : NextResponse.json({ session: null, permissions: null })

  response.headers.set("Cache-Control", "no-store")
  return response
}
