"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ➕ Add Project
export async function addProject(formData: FormData) {
    console.log("🔥 ADD PROJECT CLICKED")

  try {
    // ✅ Safe string extraction
    const name = formData.get("name")?.toString().trim()
    const location = formData.get("location")?.toString().trim() || ""
 
    console.log("DATA:", { name, location })

    if (!name) {
      console.log("❌ NAME EMPTY")
      return
    }

    await prisma.project.create({
      data: {
        name,
        location,
      },
    })
     
    console.log("✅ SAVED SUCCESS")

    revalidatePath("/schedule")
  } catch (error) {
    console.error("Add Project Error:", error)
  }
}

// ➕ Add Worker
export async function addWorker(formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim()
    const team = formData.get("team")?.toString().trim() || "General"

    if (!name) return

    await prisma.worker.create({
      data: {
        name,
        team,
      },
    })

    revalidatePath("/schedule")
  } catch (error) {
    console.error("Add Worker Error:", error)
  }
}

// ➕ Add Schedule (FIXED SAFE VERSION)
export async function addSchedule(formData: FormData) {
  try {
    const workerId = Number(formData.get("workerId"))
    const projectId = Number(formData.get("projectId"))
    const dateRaw = formData.get("date")?.toString()
    const startTime = formData.get("startTime")?.toString() || "08:00"
    const endTime = formData.get("endTime")?.toString() || "16:00"

    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)

    if (end <= start) {
      return { success: false, error: "End time must be after start time." }
    }

    if (!workerId || !projectId || !dateRaw) {
      return { success: false, error: "Please fill in worker, project, and date." }
    }

    const date = new Date(dateRaw)
    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date." }
    }

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const sameDaySchedules = await prisma.schedule.findMany({
      where: { workerId, date: { gte: dayStart, lte: dayEnd } },
      include: { project: true },
    })

    const overlap = sameDaySchedules.find((s) => {
      const existingStart = new Date(`1970-01-01T${s.startTime}`)
      const existingEnd = new Date(`1970-01-01T${s.endTime}`)
      return start < existingEnd && existingStart < end
    })

    if (overlap) {
      return {
        success: false,
        error: `This worker is already booked on ${overlap.project.name} from ${overlap.startTime} to ${overlap.endTime}.`,
      }
    }

    await prisma.schedule.create({
      data: {
        workerId,
        projectId,
        date,
        startTime,
        endTime,
      },
    })

    revalidatePath("/schedule")
    return { success: true }
  } catch (error) {
    console.error("Add Schedule Error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }
}

// ❌ Delete Schedule
export async function deleteScheduleById(formData: FormData) {
  try {
    const id = Number(formData.get("id"))

    if (!id) return

    await prisma.schedule.delete({
      where: { id },
    })

    revalidatePath("/schedule")
  } catch (error) {
    console.error("Delete Schedule Error:", error)
  }
}

// ❌ Delete Project (SAFE)
export async function deleteProject(formData: FormData) {
  try {
    const id = Number(formData.get("id"))

    if (!id) return

    // delete related schedules first
    await prisma.schedule.deleteMany({
      where: { projectId: id },
    })

    await prisma.project.delete({
      where: { id },
    })

    revalidatePath("/schedule")
  } catch (error) {
    console.error("Delete Project Error:", error)
  }
}