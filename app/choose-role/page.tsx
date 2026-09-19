"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ChooseRolePage() {
  const [loading, setLoading] = useState<"admin" | "staff" | null>(null)
  const router = useRouter()

  const choose = async (level: "admin" | "staff") => {
    setLoading(level)
    await fetch("/api/session/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    })

    // 👇 tell the header (and anything else caching the session) to re-sync
    window.dispatchEvent(new Event("storage"))

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">How are you working today?</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Choose a role for this session. You can switch anytime from the menu.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => choose("admin")}
            disabled={loading !== null}
            className="w-full text-left rounded-2xl border-2 border-sky-600 bg-sky-600 text-white p-4 hover:bg-sky-700 transition disabled:opacity-60"
          >
            <div className="font-semibold">{loading === "admin" ? "Continuing..." : "Admin"}</div>
            <div className="text-xs text-sky-100 mt-1">
              Full access — manage projects, workers, and clients, including deleting records.
            </div>
          </button>

          <button
            onClick={() => choose("staff")}
            disabled={loading !== null}
            className="w-full text-left rounded-2xl border-2 border-sky-600 bg-white text-sky-700 p-4 hover:bg-sky-50 transition disabled:opacity-60"
          >
            <div className="font-semibold">{loading === "staff" ? "Continuing..." : "Staff"}</div>
            <div className="text-xs text-sky-600 mt-1">
              Day-to-day access — view everything, assign schedules, reply to messages.
              Can&apos;t delete projects, workers, or clients.
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
