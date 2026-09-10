import Link from "next/link"
import { MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const projects = await prisma.project.findMany({
    include: {
      schedules: { include: { worker: true } },
      clients: { include: { user: true } },
    },
  })

  const projectOverview = projects.map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    scheduleCount: p.schedules.length,
    workers: Array.from(new Set(p.schedules.map((s) => s.worker.name))),
    clients: p.clients.map((c) => c.user.name),
  }))

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* PROJECTS */}
      <h2 className="text-lg font-semibold mb-3">Projects</h2>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-sm text-gray-400 mb-6">
          No projects yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                    {p.name}
                  </h3>
                  <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {p.schedules.length} scheduled
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs md:text-sm text-gray-500 mt-1">
                  <MapPin size={12} />
                  {p.location}
                </p>
              </div>

              <Link href={`/project/${p.id}`}>
                <button className="mt-3 border border-gray-300 text-xs md:text-sm py-1.5 rounded-lg hover:bg-gray-100 transition w-full">
                  View Detail
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Link href="/schedule" className="text-xs text-sky-600 hover:underline">
          View schedule →
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
        {projectOverview.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">No projects yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left p-4 font-medium">Project</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Assigned Workers</th>
                  <th className="text-left p-4 font-medium">Client</th>
                  <th className="text-left p-4 font-medium">Schedules</th>
                </tr>
              </thead>
              <tbody>
                {projectOverview.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-800">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.location}</td>
                    <td className="p-4 text-gray-600">
                      {p.workers.length > 0 ? p.workers.join(", ") : "—"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {p.clients.length > 0 ? p.clients.join(", ") : "—"}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-full">
                        {p.scheduleCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

    </div>
  )
}
