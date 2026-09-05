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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Inventory & Stock</h1>
        <p className="text-gray-500 text-sm">
          Manage and track installation components and equipment.
        </p>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <p className="text-red-600 font-medium">Out of Stock</p>
          <p className="text-sm text-gray-600">
            Heavy Duty Circuit Breakers are completely depleted.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <p className="text-yellow-600 font-medium">
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
          className="border px-4 py-2 rounded-lg w-full md:w-1/3"
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          {["All", "Electrical", "WaterSup", "AirCon"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1 rounded-full text-sm border ${
                filter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-4">Item Details</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
                  <p className="font-medium">{item.name}</p>
                </td>

                <td className="p-4">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                    {item.category}
                  </span>
                </td>

                <td className="p-4">
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
  const base = "px-3 py-1 rounded-full text-xs font-medium"

  if (status === "In Stock") {
    return (
      <span className={`${base} bg-green-100 text-green-600`}>
        In Stock
      </span>
    )
  }

  if (status === "Low Stock") {
    return (
      <span className={`${base} bg-yellow-100 text-yellow-600`}>
        Low Stock
      </span>
    )
  }

  return (
    <span className={`${base} bg-red-100 text-red-600`}>
      Out of Stock
    </span>
  )
}