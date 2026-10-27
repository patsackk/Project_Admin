"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const { t, locale } = useLanguage()

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setHistory(data))
  }, [])

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Project History", "ประวัติโครงการ")}</h1>
        <p className="page-subtitle">{t("Client projects that have been marked as done.", "โครงการของลูกค้าที่ทำเครื่องหมายว่าเสร็จสิ้นแล้ว")}</p>
      </div>

      <div className="grid gap-4">
        {history.map((h) => (
          <div
            key={h.id}
            className="card p-5"
          >
            <h2 className="font-semibold text-lg text-gray-900">{h.user?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{t("Project: ", "โครงการ: ")}{h.projectName}</p>
            <p className="text-sm text-gray-600">{t("Location: ", "สถานที่: ")}{h.location}</p>
            <p className="text-xs text-gray-400 mt-2">
              {t("Completed: ", "เสร็จสิ้น: ")}{new Date(h.completedAt).toLocaleString(locale)}
            </p>
          </div>
        ))}

        {history.length === 0 && (
          <p className="card empty-state">{t("No history yet.", "ยังไม่มีประวัติ")}</p>
        )}
      </div>
    </div>
  )
}