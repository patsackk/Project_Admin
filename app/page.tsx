"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import AdminChatbot from "@/components/AdminChatbot"

const staff = [
  { name: "Nirun Chankol", email: "nirun@gmail.com" },
  { name: "Kansire Chankol", email: "....@gmail.com" },
  { name: "Phannita Winyupradit", email: "....@gmail.com" },
];

const workers = [
  {
    team: "Electric System Teams",
    members: ["Chacrit Popu"],
  },
  {
    team: "Water Supply System Teams",
    members: ["Paniti Chankol", "....."],
  },
  {
    team: "Air Conditioning System Teams",
    members: ["Nirun Chankol"],
  },
];

const Home: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) {
        console.error("Failed to fetch projects:", res.status)
        return
      }
      const data = await res.json()
      setProjects(data)
    }

    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* PROJECTS */}
      <h2 className="text-lg font-semibold mb-3">Projects</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition"
          >
            <div>
              <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                {p.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {p.location}
              </p>
            </div>

            {/* ✅ FIXED LINK */}
            <Link href={`/project/${p.id}`}>
              <button className="mt-3 border border-gray-300 text-xs md:text-sm py-1.5 rounded-lg hover:bg-gray-100 transition w-full">
                View Detail
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* STAFF + WORKERS */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        
        {/* STAFF */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Staffs</h2>
          {staff.map((s, i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-blue-600">{s.email}</p>
              </div>
            </div>
          ))}
        </div>

        {/* WORKERS */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Workers</h2>
          {workers.map((w, i) => (
            <div key={i} className="mb-4">
              <p className="text-sm font-semibold">{w.team}</p>
              {w.members.map((m, j) => (
                <div key={j} className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <p className="text-sm">{m}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>

      {/* QUICK ACCESS */}
      <h2 className="text-lg font-semibold mb-4">Quick Access</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { name: "Schedules", href: "/schedule" },
          { name: "Stocks", href: "/stock" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-blue-50 p-4 md:p-5 rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition"
          >
            <h3 className="text-center font-semibold text-sm md:text-base text-blue-700">
              {item.name}
            </h3>

            <Link href={item.href}>
              <button className="mt-4 w-full bg-white text-blue-600 text-xs md:text-sm py-2 rounded-lg hover:bg-gray-100 transition">
                Go to {item.name}
              </button>
            </Link>
          </div>
        ))}
      </div>

      <AdminChatbot />

    </div>
  )
}

export default Home