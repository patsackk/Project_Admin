"use client"

import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProjectCard({ project }: any) {
  const router = useRouter()

  return (
    <div
      onClick={() => {
        if (!project.id) return
        router.push(`/project/${project.id}`)
      }}
      className="card cursor-pointer p-5 transition hover:shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {project.name}
      </h3>

      <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
        <MapPin size={14} />
        {project.location}
      </p>

      <div className="mt-4 flex justify-between items-center">
        <span className="badge bg-green-100 text-green-700">
          Active
        </span>

        <span className="text-xs text-gray-400">
          {project.schedules?.length || 0} schedules
        </span>
      </div>
    </div>
  )
}