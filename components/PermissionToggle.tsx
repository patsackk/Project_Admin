"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import toast from "react-hot-toast"
import { updateStaffPermission } from "@/app/permissions/actions"
import type { PermissionKey } from "@/lib/permissions"
import { useLanguage } from "@/components/LanguageProvider"

export default function PermissionToggle({
  permissionKey,
  initialValue,
}: {
  permissionKey: PermissionKey
  initialValue: boolean
}) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const { t } = useLanguage()

  const toggle = () => {
    const next = !value
    setValue(next) // optimistic
    startTransition(async () => {
      try {
        await updateStaffPermission(permissionKey, next)
        toast.success(next ? t("Granted to Staff", "ให้สิทธิ์พนักงานแล้ว") : t("Revoked from Staff", "ยกเลิกสิทธิ์พนักงานแล้ว"))
      } catch {
        setValue(!next) // revert on failure
        toast.error(t("Couldn't save that change", "บันทึกการเปลี่ยนแปลงไม่สำเร็จ"))
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={value}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition disabled:opacity-50 ${
        value ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
    >
      {value ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
    </button>
  )
}
