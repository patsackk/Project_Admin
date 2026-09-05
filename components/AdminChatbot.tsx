"use client"

import { useState } from "react"

type Message = { role: "user" | "assistant"; content: string }

export default function AdminChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Ask me about stock, schedules, or finance.",
    },
  ])
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
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await res.json()
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." },
      ])
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Failed to reach the assistant." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 h-96 bg-white rounded-2xl shadow-xl border flex flex-col overflow-hidden">
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">Admin Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  m.role === "user"
                    ? "bg-indigo-100 text-indigo-900 ml-auto"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm px-3 py-2 rounded-xl bg-gray-100 text-gray-500 w-fit">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about stock, schedule, finance..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-indigo-700 transition"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  )
}
