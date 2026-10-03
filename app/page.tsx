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
    <div className="page">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of every project, who is working on it, and its client.</p>
      </div>

      {/* PROJECTS */}
      <section className="space-y-3">
        <h2 className="section-title">Projects</h2>

        {projects.length === 0 ? (
          <div className="card empty-state">No projects yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card p-4 flex flex-col justify-between transition hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">{p.name}</h3>
                    <span className="badge bg-sky-50 text-sky-700">
                      {p.schedules.length} scheduled
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs md:text-sm text-gray-500 mt-1">
                    <MapPin size={12} />
                    {p.location}
                  </p>
                </div>

                <Link href={`/project/${p.id}`} className="btn-secondary mt-4 w-full">
                  View Detail
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RECENT ACTIVITY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recent Activity</h2>
          <Link href="/schedule" className="back-link text-xs">
            View schedule →
          </Link>
        </div>

        <div className="card overflow-hidden">
          {projectOverview.length === 0 ? (
            <p className="empty-state">No projects yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Location</th>
                    <th>Assigned Workers</th>
                    <th>Client</th>
                    <th>Schedules</th>
                  </tr>
                </thead>
                <tbody>
                  {projectOverview.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-gray-900">{p.name}</td>
                      <td className="text-gray-600">{p.location}</td>
                      <td className="text-gray-600">
                        {p.workers.length > 0 ? p.workers.join(", ") : "—"}
                      </td>
                      <td className="text-gray-600">
                        {p.clients.length > 0 ? p.clients.join(", ") : "—"}
                      </td>
                      <td>
                        <span className="badge bg-sky-50 text-sky-700">{p.scheduleCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="space-y-3">
        <h2 className="section-title">Quick Access</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { name: "Schedules", href: "/schedule" },
            { name: "Stocks", href: "/stock" },
          ].map((item) => (
            <div key={item.href} className="card p-5 flex flex-col justify-between transition hover:shadow-lg">
              <h3 className="text-center font-semibold text-sm md:text-base text-sky-700">
                {item.name}
              </h3>
              <Link href={item.href} className="btn-primary mt-4 w-full">
                Go to {item.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
