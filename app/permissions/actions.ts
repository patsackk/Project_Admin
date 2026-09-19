"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { setPermission, PERMISSION_KEYS, PermissionKey } from "@/lib/permissions"

// Only an Admin-level session may change what Staff can do — a Staff-level
// session must never be able to grant itself more access.
export async function updateStaffPermission(key: PermissionKey, value: boolean) {
  const session = await getSession()
  if (session?.role !== "admin" || session.level !== "admin") {
    throw new Error("Admin access required.")
  }

  if (!PERMISSION_KEYS.includes(key)) {
    throw new Error("Unknown permission.")
  }

  await setPermission(key, value)

  revalidatePath("/permissions")
  revalidatePath("/schedule")
  revalidatePath("/clients")
}
