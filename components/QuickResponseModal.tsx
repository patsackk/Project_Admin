"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { Send, X, Mail } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

type ContactMessage = {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  createdAt: string
  reply: string | null
  repliedAt: string | null
}

export default function QuickResponseModal({
  contact,
  onClose,
  onSent,
}: {
  contact: ContactMessage
  onClose: () => void
  onSent: (updated: ContactMessage) => void
}) {
  const [text, setText] = useState(contact.reply ?? "")
  const [sending, setSending] = useState<"save" | "email" | null>(null)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  const handleSend = async (sendEmail: boolean) => {
    if (!text.trim()) return
    setSending(sendEmail ? "email" : "save")
    setError("")

    try {
      const res = await fetch(`/api/contact/${contact.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sendEmail }),
      })
      const data = await res.json()

      // The reply can be saved even when the email fails; keep the list in sync.
      if (data.contact) onSent(data.contact)

      if (!res.ok) {
        setError(data.error || t("Failed to save reply.", "บันทึกการตอบกลับไม่สำเร็จ"))
        return
      }

      toast.success(
        data.emailSent
          ? t(`Reply saved and emailed to ${contact.email}`, `บันทึกและส่งอีเมลถึง ${contact.email} แล้ว`)
          : t("Reply saved", "บันทึกการตอบกลับแล้ว")
      )
      onClose()
    } catch {
      setError(t("Failed to save reply.", "บันทึกการตอบกลับไม่สำเร็จ"))
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-lg overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h2 className="section-title">{t("Quick Response", "ตอบกลับด่วน")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t("Responding to ", "ตอบกลับถึง ")}{contact.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close", "ปิด")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{t("To: ", "ถึง: ")}{contact.name}</p>
              <p className="text-xs text-gray-500">
                {contact.email}
                {contact.phone && ` · ${contact.phone}`}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            {contact.message}
          </div>

          {error && (
            <p className="alert-error">
              {error}
            </p>
          )}

          <div>
            <label className="label">{t("Your Message", "ข้อความของคุณ")}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={t("Type your response here...", "พิมพ์ข้อความตอบกลับที่นี่...")}
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {t(
                `"Save Reply" shows this reply to the client on the website. "Save & Send Email" also emails it to ${contact.email}.`,
                `"บันทึกการตอบกลับ" จะแสดงข้อความนี้ให้ลูกค้าเห็นบนเว็บไซต์ ส่วน "บันทึกและส่งอีเมล" จะส่งอีเมลถึง ${contact.email} ด้วย`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <button
            onClick={() => handleSend(false)}
            disabled={sending !== null || !text.trim()}
            className="btn-secondary"
          >
            <Send size={14} />
            {sending === "save" ? t("Saving...", "กำลังบันทึก...") : t("Save Reply", "บันทึกการตอบกลับ")}
          </button>
          <button
            onClick={() => handleSend(true)}
            disabled={sending !== null || !text.trim()}
            className="btn-primary"
          >
            <Mail size={14} />
            {sending === "email" ? t("Sending...", "กำลังส่ง...") : t("Save & Send Email", "บันทึกและส่งอีเมล")}
          </button>
        </div>
      </div>
    </div>
  )
}
