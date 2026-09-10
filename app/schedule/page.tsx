import Link from "next/link"
import { prisma } from "@/lib/prisma"
import AddScheduleModal from "@/components/AddScheduleModal"
import AddEntityModal from "@/components/AddEntityModal"
import UnassignedStaffPanel from "@/components/UnassignedStaffPanel"
import { addProject, addWorker, addSchedule, deleteScheduleById, deleteProject } from "../actions"
import { Clock, ChevronLeft, ChevronRight } from "lucide-react"

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number) {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function toParam(d: Date) {
  return d.toISOString().slice(0, 10)
}

type RangeType = "day" | "week" | "month"

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; range?: string }>
}) {
  const { date, view, range } = await searchParams
  const activeView = view === "worker" ? "worker" : "project"
  const activeRange: RangeType =
    range === "day" || range === "month" ? range : "week"

  const schedules = await prisma.schedule.findMany({
    include: { worker: true, project: true },
  })

  const projects = await prisma.project.findMany()
  const workers = await prisma.worker.findMany()

  const today = new Date()
  const parsedAnchor = date ? new Date(date) : today
  const anchor = isNaN(parsedAnchor.getTime()) ? today : parsedAnchor

  const workerAvailability = workers.map((w) => {
    const todaySchedule = schedules.find(
      (s) => s.workerId === w.id && sameDay(new Date(s.date), today)
    )

    return {
      ...w,
      available: !todaySchedule,
      project: todaySchedule
        ? projects.find((p) => p.id === todaySchedule.projectId)?.name
        : null,
    }
  })

  // ---- Compute navigation + view window based on range ----
  let viewDates: Date[] = []
  let prevAnchor: Date
  let nextAnchor: Date
  let rangeLabel = ""
  let monthWeeks: Date[][] = []

  if (activeRange === "day") {
    viewDates = [anchor]
    prevAnchor = addDays(anchor, -1)
    nextAnchor = addDays(anchor, 1)
    rangeLabel = anchor.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } else if (activeRange === "month") {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    const gridStart = getMonday(firstOfMonth)
    const gridEnd = addDays(getMonday(lastOfMonth), 6)

    let cursor = gridStart
    while (cursor <= gridEnd) {
      monthWeeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)))
      cursor = addDays(cursor, 7)
    }

    prevAnchor = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
    nextAnchor = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
    rangeLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  } else {
    const weekStart = getMonday(anchor)
    viewDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    prevAnchor = addDays(weekStart, -7)
    nextAnchor = addDays(weekStart, 7)
    rangeLabel = `${viewDates[0].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${viewDates[6].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  const linkFor = (a: Date, r: RangeType = activeRange, v: string = activeView) =>
    `/schedule?date=${toParam(a)}&range=${r}&view=${v}`

  const gridTemplate = { gridTemplateColumns: `200px repeat(${viewDates.length}, 1fr)` }

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Schedule System</h1>

       <div className="flex gap-2">
  <AddEntityModal
    addProject={addProject}
    addWorker={addWorker}
    defaultType="project"
    label="+ Add Project"
    buttonClass="bg-sky-100 text-sky-700 hover:bg-sky-600 hover:text-white"
  />

  <AddEntityModal
    addProject={addProject}
    addWorker={addWorker}
    defaultType="worker"
    label="+ Add Worker"
    buttonClass="bg-cyan-100 text-cyan-700 hover:bg-cyan-600 hover:text-white"
  />

  <AddScheduleModal
    workers={workers}
    projects={projects}
    action={addSchedule}
  />
</div>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl shadow px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={linkFor(prevAnchor)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="font-semibold text-sm min-w-[180px] text-center">{rangeLabel}</span>
          <Link
            href={linkFor(nextAnchor)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <ChevronRight size={16} />
          </Link>
          <Link
            href={linkFor(today)}
            className="text-sm bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-lg"
          >
            Today
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* DAY / WEEK / MONTH */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["day", "week", "month"] as RangeType[]).map((r) => (
              <Link
                key={r}
                href={linkFor(anchor, r)}
                className={`text-sm px-3 py-1 rounded-md capitalize transition ${
                  activeRange === r ? "bg-white shadow font-medium" : "text-gray-500"
                }`}
              >
                {r}
              </Link>
            ))}
          </div>

          {/* PROJECT / WORKER (hidden in month view) */}
          {activeRange !== "month" && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Link
                href={linkFor(anchor, activeRange, "project")}
                className={`text-sm px-3 py-1 rounded-md transition ${
                  activeView === "project" ? "bg-white shadow font-medium" : "text-gray-500"
                }`}
              >
                By Project
              </Link>
              <Link
                href={linkFor(anchor, activeRange, "worker")}
                className={`text-sm px-3 py-1 rounded-md transition ${
                  activeView === "worker" ? "bg-white shadow font-medium" : "text-gray-500"
                }`}
              >
                By Worker
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* STAFF SIDEBAR + CALENDAR */}
      <div className="flex gap-6 items-start">

        <UnassignedStaffPanel workers={workerAvailability.filter((w) => w.available)} />

        {/* CALENDAR */}
        <div className="bg-white rounded-xl shadow overflow-x-auto flex-1">

        {activeRange === "month" ? (
          <div>
            <div className="grid grid-cols-7 border-b bg-gray-50 text-xs text-gray-500 font-medium">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="p-2 text-center">{d}</div>
              ))}
            </div>

            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b">
                {week.map((d) => {
                  const daySchedules = schedules.filter((s) => sameDay(new Date(s.date), d))
                  const isToday = sameDay(d, today)
                  const inMonth = sameMonth(d, anchor)

                  return (
                    <div
                      key={d.toISOString()}
                      className={`min-h-[100px] p-2 border-l ${inMonth ? "" : "bg-gray-50"}`}
                    >
                      <span
                        className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
                          isToday
                            ? "bg-sky-600 text-white font-bold"
                            : inMonth
                            ? "text-gray-700"
                            : "text-gray-300"
                        }`}
                      >
                        {d.getDate()}
                      </span>

                      <div className="mt-1 space-y-1">
                        {daySchedules.slice(0, 3).map((s) => (
                          <p
                            key={s.id}
                            className="text-[10px] bg-sky-50 text-sky-700 rounded px-1 py-0.5 truncate"
                          >
                            {s.worker.name} · {s.project.name}
                          </p>
                        ))}
                        {daySchedules.length > 3 && (
                          <p className="text-[10px] text-gray-400">+{daySchedules.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
        <div>

        <div className="grid border-b bg-gray-50 text-sm" style={gridTemplate}>

          <div className="p-3 font-medium text-gray-700">
              {activeView === "worker" ? "Workers" : "Projects"}
          </div>

          {viewDates.map((d) => {
            const isToday = sameDay(d, today)
            return (
              <div
                key={d.toISOString()}
                className={`p-3 text-center border-l text-xs font-medium tracking-wide transition ${
                  isToday ? "bg-sky-50 text-sky-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div className={`text-sm ${isToday ? "font-bold" : "font-semibold text-gray-700"}`}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}

          </div>

          {/* Rows */}
          {activeView === "project" ? (
            projects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center p-8">No projects yet.</p>
            ) : (
              projects.map((project) => (
              <div key={project.id} className="grid border-b" style={gridTemplate}>

                {/* Project */}
                <div className="p-4">
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.location}</p>

                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={project.id} />
                    <button className="text-red-500 text-xs mt-2">Delete</button>
                  </form>
                </div>

                {/* Days */}
                {viewDates.map((d) => {
                  const daySchedules = schedules.filter(
                    (s) => s.projectId === project.id && sameDay(new Date(s.date), d)
                  )

                  return (
                    <div key={d.toISOString()} className="p-2 min-h-[120px] border-l">

                      {daySchedules.length > 0 ? (
                        daySchedules.map((s) => (
                          <form key={s.id} action={deleteScheduleById}>
                            <input type="hidden" name="id" value={s.id} />

                            <div className="bg-blue-100 p-2 rounded shadow mb-2">
                              <p className="text-sm font-semibold">{s.worker.name}</p>

                              <div className="flex items-center text-xs gap-1">
                                <Clock size={12} />
                                {s.startTime} - {s.endTime}
                              </div>

                              <button className="text-red-500 text-xs mt-1">
                                Unassign
                              </button>
                            </div>
                          </form>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}

                    </div>
                  )
                })}

              </div>
              ))
            )
          ) : workers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center p-8">No workers yet.</p>
          ) : (
            workers.map((worker) => (
            <div key={worker.id} className="grid border-b" style={gridTemplate}>

              {/* Worker */}
              <div className="p-4">
                <p className="font-semibold">{worker.name}</p>
                <p className="text-xs text-gray-500">{worker.team}</p>
              </div>

              {/* Days */}
              {viewDates.map((d) => {
                const daySchedules = schedules.filter(
                  (s) => s.workerId === worker.id && sameDay(new Date(s.date), d)
                )

                return (
                  <div key={d.toISOString()} className="p-2 min-h-[120px] border-l">

                    {daySchedules.length > 0 ? (
                      daySchedules.map((s) => (
                        <form key={s.id} action={deleteScheduleById}>
                          <input type="hidden" name="id" value={s.id} />

                          <div className="bg-emerald-100 p-2 rounded shadow mb-2">
                            <p className="text-sm font-semibold">{s.project.name}</p>

                            <div className="flex items-center text-xs gap-1">
                              <Clock size={12} />
                              {s.startTime} - {s.endTime}
                            </div>

                            <button className="text-red-500 text-xs mt-1">
                              Unassign
                            </button>
                          </div>
                        </form>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">Free</p>
                    )}

                  </div>
                )
              })}

            </div>
            ))
          )}

        </div>
        )}
      </div>
      </div>
    </div>
  )
}
