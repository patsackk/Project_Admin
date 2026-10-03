"use client"

import { useEffect, useState } from "react"

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data))
  }, [])

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Project History</h1>
        <p className="page-subtitle">Client projects that have been marked as done.</p>
      </div>

      <div className="grid gap-4">
        {history.map((h) => (
          <div
            key={h.id}
            className="card p-5"
          >
            <h2 className="font-semibold text-lg text-gray-900">{h.user?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Project: {h.projectName}</p>
            <p className="text-sm text-gray-600">Location: {h.location}</p>
            <p className="text-xs text-gray-400 mt-2">
              Completed: {new Date(h.completedAt).toLocaleString()}
            </p>
          </div>
        ))}

        {history.length === 0 && (
          <p className="card empty-state">No history yet.</p>
        )}
      </div>
    </div>
  )
}