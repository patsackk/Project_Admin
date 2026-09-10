"use client"

import { useState } from "react"
import { Users, Search } from "lucide-react"

type Worker = {
  id: number
  name: string
  team: string
}

export default function UnassignedStaffPanel({ workers }: { workers: Worker[] }) {
  const [search, setSearch] = useState("")

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 shrink-0 bg-gray-50 rounded-xl p-4 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-sky-600" />
        <h2 className="font-semibold text-gray-800">Unassigned Staff</h2>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search technicians..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            {workers.length === 0 ? "Everyone is assigned today." : "No match."}
          </p>
        ) : (
          filtered.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium text-sm text-gray-800">{w.name}</p>
              </div>
              <span className="inline-block mt-2 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {w.team}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
