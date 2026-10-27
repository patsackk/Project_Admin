import { Fragment } from "react"
import { Check, X } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getPermissions, PermissionKey } from "@/lib/permissions"
import PermissionToggle from "@/components/PermissionToggle"
import { getT } from "@/lib/i18n-server"
import type { Translate } from "@/lib/i18n"

type Row = {
  action: string
  admin: boolean
  staff: boolean
  key?: PermissionKey // present only for rows an admin can toggle
}

function buildGroups(staffFlags: Record<PermissionKey, boolean>, t: Translate): { title: string; rows: Row[] }[] {
  return [
    {
      title: t("Viewing", "การดูข้อมูล"),
      rows: [
        { action: t("View Home, Schedule, Stock, Clients, History, Messages", "ดูหน้าหลัก ตารางงาน คลังวัสดุ ลูกค้า ประวัติ และข้อความ"), admin: true, staff: true },
      ],
    },
    {
      title: t("Schedule", "ตารางงาน"),
      rows: [
        { action: t("Add a schedule (assign a worker to a project)", "เพิ่มตารางงาน (มอบหมายผู้ปฏิบัติงานให้โครงการ)"), admin: true, staff: true },
        { action: t("Unassign a schedule", "ยกเลิกการมอบหมายตารางงาน"), admin: true, staff: staffFlags.unassignSchedule, key: "unassignSchedule" },
        { action: t("Add a project", "เพิ่มโครงการ"), admin: true, staff: staffFlags.addProject, key: "addProject" },
        { action: t("Delete a project", "ลบโครงการ"), admin: true, staff: staffFlags.deleteProject, key: "deleteProject" },
        { action: t("Add a worker", "เพิ่มผู้ปฏิบัติงาน"), admin: true, staff: staffFlags.addWorker, key: "addWorker" },
      ],
    },
    {
      title: t("Clients", "ลูกค้า"),
      rows: [
        { action: t("Add a client and link them to a project", "เพิ่มลูกค้าและเชื่อมกับโครงการ"), admin: true, staff: true },
        { action: t("Edit a client's project/location", "แก้ไขโครงการ/สถานที่ของลูกค้า"), admin: true, staff: true },
        { action: t("Delete a client", "ลบลูกค้า"), admin: true, staff: staffFlags.deleteClient, key: "deleteClient" },
        { action: t("Mark a client \"Done\" (archive to history)", "ทำเครื่องหมายลูกค้าว่า \"เสร็จสิ้น\" (ย้ายไปประวัติ)"), admin: true, staff: staffFlags.markClientDone, key: "markClientDone" },
      ],
    },
    {
      title: t("Website", "เว็บไซต์"),
      rows: [
        {
          action: t(
            "Edit client website content (projects, services, home slider)",
            "แก้ไขเนื้อหาเว็บไซต์ลูกค้า (ผลงาน บริการ ภาพสไลด์หน้าแรก)"
          ),
          admin: true,
          staff: staffFlags.manageContent,
          key: "manageContent",
        },
      ],
    },
    {
      title: t("Messages", "ข้อความ"),
      rows: [
        { action: t("Reply to contact form messages", "ตอบกลับข้อความจากแบบฟอร์มติดต่อ"), admin: true, staff: true },
      ],
    },
    {
      title: t("Session", "เซสชัน"),
      rows: [
        { action: t("Switch role (Admin ↔ Staff)", "เปลี่ยนบทบาท (ผู้ดูแลระบบ ↔ พนักงาน)"), admin: true, staff: true },
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
  const t = await getT()
  const currentLevel = session?.level ?? null
  const canEdit = session?.role === "admin" && currentLevel === "admin"

  const staffFlags = await getPermissions()
  const GROUPS = buildGroups(staffFlags, t)

  return (
    <div className="page">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="page-title">{t("Permissions", "สิทธิ์การใช้งาน")}</h1>
          <p className="page-subtitle">
            {canEdit
              ? t(
                  "What Admin and Staff can each do in this dashboard. Click a Staff mark to grant or revoke it.",
                  "สิ่งที่ผู้ดูแลระบบและพนักงานทำได้ในแดชบอร์ดนี้ คลิกเครื่องหมายในช่องพนักงานเพื่อให้หรือยกเลิกสิทธิ์"
                )
              : t(
                  "What Admin and Staff can each do in this dashboard.",
                  "สิ่งที่ผู้ดูแลระบบและพนักงานทำได้ในแดชบอร์ดนี้"
                )}
          </p>
        </div>

        {currentLevel && (
          <span className="badge bg-sky-100 text-sky-700 capitalize">
            {t("You're signed in as ", "คุณเข้าสู่ระบบในฐานะ")}
            {currentLevel === "admin" ? t("admin", "ผู้ดูแลระบบ") : t("staff", "พนักงาน")}
          </span>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Action", "การดำเนินการ")}</th>
              <th className="text-center w-28">
                <span className={currentLevel === "admin" ? "text-sky-700" : ""}>{t("Admin", "ผู้ดูแลระบบ")}</span>
              </th>
              <th className="text-center w-28">
                <span className={currentLevel === "staff" ? "text-sky-700" : ""}>{t("Staff", "พนักงาน")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-gray-50/60 hover:bg-gray-50/60">
                  <td colSpan={3} className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.action}>
                    <td className="text-gray-700">{row.action}</td>
                    <td className="text-center">
                      <Mark allowed={row.admin} />
                    </td>
                    <td className="text-center">
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
        {t(
          "Actions Staff can't do are also hidden from the Staff view elsewhere in the dashboard, and are rejected by the server even if requested directly.",
          "การดำเนินการที่พนักงานไม่มีสิทธิ์จะถูกซ่อนจากมุมมองของพนักงานในส่วนอื่นของแดชบอร์ด และเซิร์ฟเวอร์จะปฏิเสธแม้จะส่งคำขอโดยตรง"
        )}
      </p>
    </div>
  )
}
