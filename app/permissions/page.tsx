import { Fragment } from "react"
import { Check, X } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getPermissions, PermissionKey } from "@/lib/permissions"
import PermissionToggle from "@/components/PermissionToggle"

type Row = {
  action: string
  admin: boolean
  staff: boolean
  key?: PermissionKey // present only for rows an admin can toggle
}

function buildGroups(staffFlags: Record<PermissionKey, boolean>): { title: string; rows: Row[] }[] {
  return [
    {
      title: "Viewing",
      rows: [
        { action: "View Home, Schedule, Stock, Clients, History, Messages", admin: true, staff: true },
      ],
    },
    {
      title: "Schedule",
      rows: [
        { action: "Add a schedule (assign a worker to a project)", admin: true, staff: true },
        { action: "Unassign a schedule", admin: true, staff: staffFlags.unassignSchedule, key: "unassignSchedule" },
        { action: "Add a project", admin: true, staff: staffFlags.addProject, key: "addProject" },
        { action: "Delete a project", admin: true, staff: staffFlags.deleteProject, key: "deleteProject" },
        { action: "Add a worker", admin: true, staff: staffFlags.addWorker, key: "addWorker" },
      ],
    },
    {
      title: "Clients",
      rows: [
        { action: "Add a client and link them to a project", admin: true, staff: true },
        { action: "Edit a client's project/location", admin: true, staff: true },
        { action: "Delete a client", admin: true, staff: staffFlags.deleteClient, key: "deleteClient" },
        { action: "Mark a client \"Done\" (archive to history)", admin: true, staff: staffFlags.markClientDone, key: "markClientDone" },
      ],
    },
    {
      title: "Messages",
      rows: [
        { action: "Reply to contact form messages", admin: true, staff: true },
      ],
    },
    {
      title: "Session",
      rows: [
        { action: "Switch role (Admin ↔ Staff)", admin: true, staff: true },
      ],
    },
  ]
}

function Mark({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
      <Check size={14} strokeWidth={3} />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
      <X size={14} strokeWidth={3} />
    </span>
  )
}

export default async function PermissionsPage() {
  const session = await getSession()
  const currentLevel = session?.level ?? null
  const canEdit = session?.role === "admin" && currentLevel === "admin"

  const staffFlags = await getPermissions()
  const GROUPS = buildGroups(staffFlags)

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {canEdit
              ? "What Admin and Staff can each do in this dashboard. Click a Staff mark to grant or revoke it."
              : "What Admin and Staff can each do in this dashboard."}
          </p>
        </div>

        {currentLevel && (
          <span className="px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold capitalize">
            You're signed in as {currentLevel}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-4 font-medium">Action</th>
              <th className="text-center p-4 font-medium w-28">
                <span className={currentLevel === "admin" ? "text-sky-700" : ""}>Admin</span>
              </th>
              <th className="text-center p-4 font-medium w-28">
                <span className={currentLevel === "staff" ? "text-sky-700" : ""}>Staff</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-gray-50/60">
                  <td colSpan={3} className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.action} className="border-t hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-700">{row.action}</td>
                    <td className="p-4 text-center">
                      <Mark allowed={row.admin} />
                    </td>
                    <td className="p-4 text-center">
                      {canEdit && row.key ? (
                        <PermissionToggle permissionKey={row.key} initialValue={row.staff} />
                      ) : (
                        <Mark allowed={row.staff} />
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Actions Staff can't do are also hidden from the Staff view elsewhere in the dashboard,
        and are rejected by the server even if requested directly.
      </p>
    </div>
  )
}
