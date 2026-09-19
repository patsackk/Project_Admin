import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// Actions that are admin-only by default but can be individually granted to
// Staff-level sessions by an Admin from the /permissions page. Anything not
// in this list (viewing pages, adding a schedule, adding/editing a client)
// stays available to both roles and isn't configurable.
export const PERMISSION_KEYS = [
  "unassignSchedule",
  "addProject",
  "deleteProject",
  "addWorker",
  "deleteClient",
  "markClientDone",
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export type PermissionFlags = Record<PermissionKey, boolean>

const SETTINGS_ID = 1

// The permission row is a singleton (id 1). Created on first read if it
// doesn't exist yet, so there's nothing to seed/migrate manually.
export async function getPermissions(): Promise<PermissionFlags> {
  const row = await prisma.permission.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  })

  return {
    unassignSchedule: row.staffUnassignSchedule,
    addProject: row.staffAddProject,
    deleteProject: row.staffDeleteProject,
    addWorker: row.staffAddWorker,
    deleteClient: row.staffDeleteClient,
    markClientDone: row.staffMarkClientDone,
  }
}

export async function setPermission(key: PermissionKey, value: boolean) {
  const field = `staff${key[0].toUpperCase()}${key.slice(1)}` as
    | "staffUnassignSchedule"
    | "staffAddProject"
    | "staffDeleteProject"
    | "staffAddWorker"
    | "staffDeleteClient"
    | "staffMarkClientDone"

  await prisma.permission.upsert({
    where: { id: SETTINGS_ID },
    update: { [field]: value },
    create: { id: SETTINGS_ID, [field]: value },
  })
}

// The real, server-enforced gate for an individual staff-toggleable action.
// Admin-level sessions always pass; Staff-level sessions pass only if the
// action has been granted via /permissions.
export async function hasAccess(key: PermissionKey): Promise<boolean> {
  const session = await getSession()
  if (session?.role !== "admin") return false
  if (session.level === "admin") return true
  if (session.level !== "staff") return false

  const flags = await getPermissions()
  return flags[key]
}
