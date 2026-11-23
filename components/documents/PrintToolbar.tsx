"use client"

import { useEffect, type ReactNode } from "react"
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

  // A4 sheets are wider than a phone. Shrink each one to fit the screen so
  // the whole page is readable without sideways scrolling. Screen only:
  // printing resets the zoom (globals.css), so the paper stays full size.
  useEffect(() => {
    const fit = () => {
      const available = document.documentElement.clientWidth - 24 // .doc-viewer side padding
      document.querySelectorAll<HTMLElement>(".sheet").forEach((sheet) => {
        sheet.style.zoom = ""
        const width = sheet.offsetWidth
        if (width > available) sheet.style.zoom = String(available / width)
      })
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

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
      <div className="flex flex-wrap gap-2 [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap">
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
