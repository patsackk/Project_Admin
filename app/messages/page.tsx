"use client"

import { useEffect, useState } from "react"
import { Search, Reply } from "lucide-react"
import QuickResponseModal from "@/components/QuickResponseModal"

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
        <h1 className="page-title">Client Communications</h1>
        <p className="page-subtitle">Messages submitted through the contact form.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">No messages found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Received</th>
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
                          Replied
                        </span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="text-gray-500 text-xs">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => setActive(m)}
                        className="btn-secondary px-3 py-1 text-xs"
                      >
                        <Reply size={13} />
                        Reply
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
          onSent={(updated) =>
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
          }
        />
      )}
    </div>
  )
}
