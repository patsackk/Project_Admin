"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export default function AddScheduleModal({ workers, projects, action }: any) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => {
          setError("")
          setOpen(true)
        }}
        className="btn-primary px-4 py-1.5"
      >
        + Add Schedule
      </button>

      {/* MODAL */}
      {open && (
        <div className="modal-backdrop">
          <form
  onSubmit={async (e) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    setSubmitting(true)
    setError("")

    const result = await action(formData)

    setSubmitting(false)

    if (result?.success === false) {
      setError(result.error || "Something went wrong.")
      return
    }

    setOpen(false)
    toast.success("Schedule added")
  }}
            className="modal p-6 space-y-4"
          >
            <h2 className="section-title">
              Assign Schedule
            </h2>

            {error && (
              <p className="alert-error">
                {error}
              </p>
            )}

            {/* Worker */}
            <div>
              <label className="label">Worker</label>
              <select name="workerId" className="input">
                {workers.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="label">Project</label>
              <select name="projectId" className="input">
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                name="date"
                className="input"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input
                  type="time"
                  name="startTime"
                  defaultValue="08:00"
                  className="input"
                />
              </div>

              <div>
                <label className="label">End</label>
                <input
                  type="time"
                  name="endTime"
                  defaultValue="16:00"
                  className="input"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

    </>
  )
}