"use client"

import { useState } from "react"
import { Send, X, Mail } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

type ContactMessage = {
  id: number
  name: string
  email: string
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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    setError("")

    try {
      const res = await fetch(`/api/contact/${contact.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("Failed to save reply.", "บันทึกการตอบกลับไม่สำเร็จ"))
        return
      }

      onSent(data)
      onClose()
    } catch {
      setError(t("Failed to save reply.", "บันทึกการตอบกลับไม่สำเร็จ"))
    } finally {
      setSending(false)
    }
  }

  const mailtoHref = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
    t("Re: your message to UTO Advance Engineering", "ตอบกลับ: ข้อความของคุณถึง UTO Advance Engineering")
  )}&body=${encodeURIComponent(text)}`

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
              <p className="text-xs text-gray-500">{contact.email}</p>
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
                `"Save Reply" saves this reply and shows it to the client on the website. "Send via Email" opens your email app with this message ready to send to ${contact.email}.`,
                `"บันทึกการตอบกลับ" จะบันทึกข้อความนี้และแสดงให้ลูกค้าเห็นบนเว็บไซต์ ส่วน "ส่งทางอีเมล" จะเปิดแอปอีเมลพร้อมข้อความนี้เพื่อส่งถึง ${contact.email}`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <a
            href={text.trim() ? mailtoHref : undefined}
            aria-disabled={!text.trim()}
            onClick={(e) => {
              if (!text.trim()) e.preventDefault()
            }}
            className={`btn-secondary ${
              !text.trim() ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Mail size={14} />
            {t("Send via Email", "ส่งทางอีเมล")}
          </a>
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="btn-primary"
          >
            <Send size={14} />
            {sending ? t("Saving...", "กำลังบันทึก...") : t("Save Reply", "บันทึกการตอบกลับ")}
          </button>
        </div>
      </div>
    </div>
  )
}
