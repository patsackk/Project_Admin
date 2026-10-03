"use client"

import { useState } from "react"
import { Users, Search } from "lucide-react"

type Worker = {
  id: number
  name: string
  team: string
}

export default function UnassignedStaffPanel({
  workers,
  scopeLabel = "today",
}: {
  workers: Worker[]
  scopeLabel?: string
}) {
  const [search, setSearch] = useState("")

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="card w-72 shrink-0 p-4 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-sky-600" />
        <div>
          <h2 className="font-semibold text-gray-900">Unassigned Staff</h2>
          <p className="text-xs text-gray-400 capitalize">Free {scopeLabel}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search technicians..."
          className="input pl-8"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            {workers.length === 0 ? `Everyone is assigned ${scopeLabel}.` : "No match."}
          </p>
        ) : (
          filtered.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium text-sm text-gray-900">{w.name}</p>
              </div>
              <span className="badge mt-2 bg-white text-gray-600 border border-gray-200">
                {w.team}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
