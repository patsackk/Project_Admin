"use client"

import { useState } from "react"

export default function AddScheduleModal({ workers, projects, action }: any) {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
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
        className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-sm hover:bg-indigo-600 hover:text-white transition"
      >
        + Add Schedule
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
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
    setSuccess(true)

    setTimeout(() => setSuccess(false), 2000)
  }}
            className="bg-white p-6 rounded-2xl shadow-xl w-[340px] space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              Assign Schedule
            </h2>

            {error && (
              <p className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Worker */}
            <div>
              <label className="text-xs text-gray-500">Worker</label>
              <select name="workerId" className="border rounded-lg p-2 w-full mt-1">
                {workers.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="text-xs text-gray-500">Project</label>
              <select name="projectId" className="border rounded-lg p-2 w-full mt-1">
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                name="date"
                className="border rounded-lg p-2 w-full mt-1"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <input
                  type="time"
                  name="startTime"
                  defaultValue="08:00"
                  className="border rounded-lg p-2 w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">End</label>
                <input
                  type="time"
                  name="endTime"
                  defaultValue="16:00"
                  className="border rounded-lg p-2 w-full mt-1"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 text-sm"
              >
                Cancel
              </button>

              <button
                disabled={submitting}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {success && (
  <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm">
    🎉 Added successfully!
  </div>
)}
    </>
  )
}