"use client"

import { useState } from "react"
import { stockItems as items } from "@/lib/stockData"

export default function StockPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

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
        <h1 className="page-title">Inventory & Stock</h1>
        <p className="page-subtitle">
          Manage and track installation components and equipment.
        </p>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-semibold">Out of Stock</p>
          <p className="text-sm text-gray-600">
            Heavy Duty Circuit Breakers are completely depleted.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-700 font-semibold">
            Low Inventory
          </p>
          <p className="text-sm text-gray-600">
            High-Pressure Water Pump X5 is running low.
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search item name..."
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
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Details</th>
              <th>Category</th>
              <th>Status</th>
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
                    {item.category}
                  </span>
                </td>

                <td>
                  <StatusBadge status={item.status} />
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
function StatusBadge({ status }: { status: string }) {
  const base = "badge"

  if (status === "In Stock") {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        In Stock
      </span>
    )
  }

  if (status === "Low Stock") {
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        Low Stock
      </span>
    )
  }

  return (
    <span className={`${base} bg-red-100 text-red-700`}>
      Out of Stock
    </span>
  )
}