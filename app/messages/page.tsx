"use client"

import { useEffect, useState } from "react"
import { Search, Reply } from "lucide-react"
import QuickResponseModal from "@/components/QuickResponseModal"
import { NOTIFICATIONS_REFRESH_EVENT } from "@/components/NotificationBell"
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

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [search, setSearch] = useState("")
  const [active, setActive] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, locale } = useLanguage()

  useEffect(() => {
    fetch("/api/contact", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data)
        setLoading(false)
      })
  }, [])

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Client Communications", "ข้อความจากลูกค้า")}</h1>
        <p className="page-subtitle">{t("Messages submitted through the contact form.", "ข้อความที่ส่งผ่านแบบฟอร์มติดต่อ")}</p>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search messages...", "ค้นหาข้อความ...")}
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="empty-state">{t("Loading...", "กำลังโหลด...")}</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">{t("No messages found.", "ไม่พบข้อความ")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Client", "ลูกค้า")}</th>
                  <th>{t("Message", "ข้อความ")}</th>
                  <th>{t("Status", "สถานะ")}</th>
                  <th>{t("Received", "วันที่ได้รับ")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-700">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600 max-w-xs truncate">{m.message}</td>
                    <td>
                      {m.repliedAt ? (
                        <span className="badge bg-green-100 text-green-700">
                          {t("Replied", "ตอบกลับแล้ว")}
                        </span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700">
                          {t("Pending", "รอตอบกลับ")}
                        </span>
                      )}
                    </td>
                    <td className="text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString(locale)}
                    </td>
                    <td>
                      <button
                        onClick={() => setActive(m)}
                        className="btn-secondary px-3 py-1 text-xs"
                      >
                        <Reply size={13} />
                        {t("Reply", "ตอบกลับ")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <QuickResponseModal
          contact={active}
          onClose={() => setActive(null)}
          onSent={(updated) => {
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
            window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT))
          }}
        />
      )}
    </div>
  )
}
