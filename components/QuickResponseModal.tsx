"use client"

import { useState } from "react"
import { Send, X, Mail } from "lucide-react"

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
        setError(data.error || "Failed to save reply.")
        return
      }

      onSent(data)
      onClose()
    } catch {
      setError("Failed to save reply.")
    } finally {
      setSending(false)
    }
  }

  const mailtoHref = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
    "Re: your message to UTO Advance Engineering"
  )}&body=${encodeURIComponent(text)}`

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* HEADER */}
        <div className="bg-sky-600 text-white px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="font-bold">Quick Response</h2>
            <p className="text-xs text-sky-100 mt-0.5">Responding to {contact.name}</p>
          </div>
          <button onClick={onClose} className="text-sky-100 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">To: {contact.name}</p>
              <p className="text-xs text-gray-500">{contact.email}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            {contact.message}
          </div>

          {error && (
            <p className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 tracking-wide">
              YOUR MESSAGE
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Type your response here..."
              className="mt-1 w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              "Save Reply" records this internally. "Send via Email" opens your email app
              with this message ready to send to {contact.email}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <a
            href={text.trim() ? mailtoHref : undefined}
            aria-disabled={!text.trim()}
            onClick={(e) => {
              if (!text.trim()) e.preventDefault()
            }}
            className={`flex items-center gap-2 border border-sky-600 text-sky-600 px-4 py-2 rounded-lg text-sm hover:bg-sky-50 transition ${
              !text.trim() ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <Mail size={14} />
            Send via Email
          </a>
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50"
          >
            <Send size={14} />
            {sending ? "Saving..." : "Save Reply"}
          </button>
        </div>
      </div>
    </div>
  )
}
