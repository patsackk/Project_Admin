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
    <div className="modal-backdrop">
      <div className="modal max-w-lg overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h2 className="section-title">Quick Response</h2>
            <p className="text-xs text-gray-500 mt-0.5">Responding to {contact.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
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
              <p className="text-sm font-medium">To: {contact.name}</p>
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
            <label className="label">Your Message</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Type your response here..."
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              "Save Reply" records this internally. "Send via Email" opens your email app
              with this message ready to send to {contact.email}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="btn-ghost">
            Cancel
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
            Send via Email
          </a>
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="btn-primary"
          >
            <Send size={14} />
            {sending ? "Saving..." : "Save Reply"}
          </button>
        </div>
      </div>
    </div>
  )
}
