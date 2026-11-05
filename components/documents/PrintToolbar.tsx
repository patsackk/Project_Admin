"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Printer } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

// backHref/editHref/actions are for the admin view; the client's shared link
// gets just the print button.
export default function PrintToolbar({
  backHref,
  editHref,
  actions,
}: {
  backHref?: string
  editHref?: string
  actions?: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <div className="no-print mx-auto mb-6 flex max-w-[297mm] flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      {backHref ? (
        <Link href={backHref} className="back-link">
          <ArrowLeft size={16} /> {t("Back", "กลับ")}
        </Link>
      ) : (
        <span className="text-sm font-semibold text-gray-700">UTO Advance Engineering</span>
      )}
      <p className="hidden text-xs text-gray-500 md:block">
        {t(
          "To save a PDF, click Print and choose “Save as PDF”.",
          "ต้องการไฟล์ PDF ให้กดพิมพ์แล้วเลือก “บันทึกเป็น PDF”"
        )}
      </p>
      <div className="flex gap-2">
        {actions}
        {editHref && (
          <Link href={editHref} className="btn-secondary">
            <Pencil size={16} /> {t("Edit", "แก้ไข")}
          </Link>
        )}
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> {t("Print / PDF", "พิมพ์ / PDF")}
        </button>
      </div>
    </div>
  )
}
