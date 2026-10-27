"use client"

import { useState } from "react"
import { stockItems as items } from "@/lib/stockData"
import { useLanguage } from "@/components/LanguageProvider"
import type { Translate } from "@/lib/i18n"

export default function StockPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const { t } = useLanguage()

  const categoryLabel: Record<string, string> = {
    All: t("All", "ทั้งหมด"),
    Electrical: t("Electrical", "ระบบไฟฟ้า"),
    WaterSup: t("WaterSup", "ระบบประปา"),
    AirCon: t("AirCon", "ระบบปรับอากาศ"),
  }

  const filteredItems = items.filter((item) => {
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" || item.category === filter)
    )
  })

  return (
    <div className="page">
      {/* Header */}
      <div>
        <h1 className="page-title">{t("Inventory & Stock", "คลังวัสดุและอุปกรณ์")}</h1>
        <p className="page-subtitle">
          {t("Manage and track installation components and equipment.", "จัดการและติดตามชิ้นส่วนและอุปกรณ์สำหรับงานติดตั้ง")}
        </p>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-semibold">{t("Out of Stock", "สินค้าหมด")}</p>
          <p className="text-sm text-gray-600">
            {t("Heavy Duty Circuit Breakers are completely depleted.", "Heavy Duty Circuit Breaker หมดสต็อกแล้ว")}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-700 font-semibold">
            {t("Low Inventory", "สินค้าใกล้หมด")}
          </p>
          <p className="text-sm text-gray-600">
            {t("High-Pressure Water Pump X5 is running low.", "High-Pressure Water Pump X5 เหลือน้อย")}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <input
          type="text"
          placeholder={t("Search item name...", "ค้นหาชื่อสินค้า...")}
          className="input md:w-1/3"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {["All", "Electrical", "WaterSup", "AirCon"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`${filter === cat ? "btn-primary" : "btn-secondary"} px-4 py-1.5`}
            >
              {categoryLabel[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Item Details", "รายละเอียดสินค้า")}</th>
              <th>{t("Category", "หมวดหมู่")}</th>
              <th>{t("Status", "สถานะ")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="font-medium text-gray-900">{item.name}</p>
                </td>

                <td>
                  <span className="badge bg-gray-100 text-gray-600">
                    {categoryLabel[item.category] ?? item.category}
                  </span>
                </td>

                <td>
                  <StatusBadge status={item.status} t={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ✅ CLEAN STATUS (ONLY 3 TYPES)
function StatusBadge({ status, t }: { status: string; t: Translate }) {
  const base = "badge"

  if (status === "In Stock") {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        {t("In Stock", "มีสินค้า")}
      </span>
    )
  }

  if (status === "Low Stock") {
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        {t("Low Stock", "ใกล้หมด")}
      </span>
    )
  }

  return (
    <span className={`${base} bg-red-100 text-red-700`}>
      {t("Out of Stock", "สินค้าหมด")}
    </span>
  )
}