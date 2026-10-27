"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { MessageCircle, X } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

type Message = { role: "user" | "assistant"; content: string }

export default function AdminChatbot() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setOpen(false)
  }, [pathname])
  // The greeting isn't stored in state so it follows the current language.
  const greeting: Message = {
    role: "assistant",
    content: t(
      "Hi! Ask me about stock, schedules, or finance.",
      "สวัสดีครับ! สอบถามเรื่องคลังวัสดุ ตารางงาน หรือการเงินได้เลย"
    ),
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [greeting, ...nextMessages] }),
      })
      const data = await res.json()
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? data.error ?? t("Something went wrong.", "เกิดข้อผิดพลาด") },
      ])
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: t("Failed to reach the assistant.", "ไม่สามารถเชื่อมต่อผู้ช่วยได้") },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 h-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">{t("Admin Assistant", "ผู้ช่วยแอดมิน")}</span>
            <button onClick={() => setOpen(false)} aria-label={t("Close", "ปิด")} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {[greeting, ...messages].map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  m.role === "user"
                    ? "bg-sky-100 text-sky-900 ml-auto"
                    : "bg-gray-100 text-gray-800 prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 max-w-[85%]"
                }`}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            ))}
            {loading && (
              <div className="text-sm px-3 py-2 rounded-xl bg-gray-100 text-gray-500 w-fit">
                {t("Thinking...", "กำลังคิด...")}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("Ask about stock, schedule, finance...", "ถามเรื่องคลังวัสดุ ตารางงาน การเงิน...")}
              className="input flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="btn-primary px-4"
            >
              {t("Send", "ส่ง")}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("Close assistant", "ปิดผู้ช่วย") : t("Open assistant", "เปิดผู้ช่วย")}
        className="bg-sky-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-sky-700 transition"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
