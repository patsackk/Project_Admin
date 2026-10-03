"use client"

import { useEffect, useState } from "react"
import ProjectCard from "@/components/admin/ProjectCard"

export default function ProjectPage() {
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data)
    }

    fetchProjects()
  }, [])

  return (
    <div className="page">
      <h1 className="page-title">Projects</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}