import { prisma } from "@/lib/prisma"
import AddScheduleModal from "@/components/AddScheduleModal"
import AddEntityModal from "@/components/AddEntityModal"
import { addProject, addWorker, addSchedule, deleteScheduleById, deleteProject } from "../actions"
import { Clock } from "lucide-react"

export default async function SchedulePage() {
  const schedules = await prisma.schedule.findMany({
    include: { worker: true, project: true },
  })

  const projects = await prisma.project.findMany()
  const workers = await prisma.worker.findMany()

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const today = new Date()

  const getDateLabel = (index: number) => {
  const date = new Date()
  date.setDate(today.getDate() - today.getDay() + index + 1)

  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    date: date.getDate(),
    isToday: date.toDateString() === today.toDateString(),
  }
}
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

      {/* CALENDAR */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
      
      <div className="grid grid-cols-8 border-b bg-gray-50 text-sm">

        <div className="p-3 font-medium text-gray-700">
            Projects
        </div>

        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
            key={day}
            className="p-4 text-center border-l text-gray-500 text-xs font-medium tracking-wide hover:bg-gray-100 transition"
            >
            {day}
            </div>
        ))}

        </div>

        {/* Rows */}
        {projects.map((project: any) => (
          <div key={project.id} className="grid grid-cols-8 border-b">

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
            {days.map((day) => {
              const daySchedules = schedules.filter((s: any) => {
                if (!s.date) return false

                const date = new Date(s.date)
                if (isNaN(date.getTime())) return false

                const d = date.toLocaleDateString("en-US", { weekday: "short" })

                return s.projectId === project.id && d === day
              })

              return (
                <div key={day} className="p-2 min-h-[120px] border-l">

                  {daySchedules.length > 0 ? (
                    daySchedules.map((s: any) => (
                      <form key={s.id} action={deleteScheduleById}>
                        <input type="hidden" name="id" value={s.id} />

                        <div className="bg-blue-100 p-2 rounded shadow mb-2">
                          <p className="text-sm font-semibold">{s.worker.name}</p>

                          <div className="flex items-center text-xs gap-1">
                            <Clock size={12} />
                            {s.startTime} - {s.endTime}
                          </div>

                          <button className="text-red-500 text-xs mt-1">
                            Delete
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
        ))}

      </div>
    </div>
  )
}