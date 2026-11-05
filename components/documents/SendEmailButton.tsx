"use client"

import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Mail, Paperclip, Send, X } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { emailDefaults, formatThaiDate, type DocKind } from "@/lib/documents"
import { sendDocumentEmail } from "@/app/documents/actions"

export type SendInfo = {
  kind: DocKind
  id: number
  label: string
  clientName: string
  clientEmail: string
  projectName: string
  subject?: string
  amount: number
  dueDate?: string | null
  sentAt: string | null
  sentTo: string
}

export default function SendEmailButton({ doc, variant }: { doc: SendInfo; variant: "icon" | "button" }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-sky-100 hover:text-sky-700"
          aria-label={t("Send by email", "ส่งทางอีเมล")}
        >
          <Mail size={16} />
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-secondary">
          <Mail size={16} /> {t("Send email", "ส่งอีเมล")}
        </button>
      )}
      {/* On <body>, so it isn't inside the row's tooltip or table cell. */}
      {open && createPortal(<SendEmailModal doc={doc} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function SendEmailModal({ doc, onClose }: { doc: SendInfo; onClose: () => void }) {
  const { t } = useLanguage()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const defaults = emailDefaults(doc.kind, doc)
  const [fileName, setFileName] = useState("")

  const submit = (formData: FormData) => {
    formData.set("kind", doc.kind)
    formData.set("id", String(doc.id))
    startTransition(async () => {
      const result = await sendDocumentEmail(formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t(`Sent to ${formData.get("to")}`, `ส่งถึง ${formData.get("to")} แล้ว`))
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-h-[90vh] max-w-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form action={submit} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">
                {t(`Email ${doc.kind} ${doc.label}`, `ส่ง${doc.kind === "quotation" ? "ใบเสนอราคา" : "ใบแจ้งหนี้"} ${doc.label} ทางอีเมล`)}
              </h2>
              {doc.sentAt && (
                <p className="text-xs text-gray-500">
                  {t(
                    `Last sent to ${doc.sentTo} on ${formatThaiDate(doc.sentAt)}`,
                    `ส่งล่าสุดถึง ${doc.sentTo} เมื่อ ${formatThaiDate(doc.sentAt)}`
                  )}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="btn-ghost px-2">
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="label">{t("To", "ถึง")}</label>
            <input
              name="to"
              defaultValue={doc.clientEmail}
              placeholder="client@example.com"
              required
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("Separate several addresses with commas.", "หลายอีเมลให้คั่นด้วยเครื่องหมายจุลภาค (,)")}
            </p>
          </div>
          <div>
            <label className="label">{t("Subject", "หัวเรื่อง")}</label>
            <input name="subject" defaultValue={defaults.subject} required className="input" />
          </div>
          <div>
            <label className="label">{t("Message", "ข้อความ")}</label>
            <textarea name="message" rows={9} defaultValue={defaults.message} required className="input" />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" name="includeLink" defaultChecked className="mt-0.5 h-4 w-4 accent-sky-600" />
            <span>
              {t("Include a link to view and download it", "แนบลิงก์ให้ลูกค้าเปิดดูและดาวน์โหลด")}
              <span className="block text-xs text-gray-500">
                {t(
                  "The client opens the document without logging in. Only people with the link can see it.",
                  "ลูกค้าเปิดดูได้โดยไม่ต้องเข้าสู่ระบบ เฉพาะผู้ที่มีลิงก์เท่านั้นที่เห็นเอกสาร"
                )}
              </span>
            </span>
          </label>

          <div>
            <label className="btn-ghost cursor-pointer border border-dashed border-gray-300">
              <Paperclip size={16} />
              {fileName || t("Attach PDF (optional)", "แนบไฟล์ PDF (ไม่บังคับ)")}
              <input
                type="file"
                name="attachment"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {t(
                "To attach the file itself: open the document, click Print / PDF → “Save as PDF”, then pick that file here.",
                "ต้องการแนบไฟล์: เปิดเอกสาร กดพิมพ์ / PDF → “บันทึกเป็น PDF” แล้วเลือกไฟล์นั้นที่นี่"
              )}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              {t("Cancel", "ยกเลิก")}
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              <Send size={16} /> {pending ? t("Sending…", "กำลังส่ง…") : t("Send", "ส่ง")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
