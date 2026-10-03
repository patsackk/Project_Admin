"use client"

import { useState, useTransition } from "react"
import toast from "react-hot-toast"

export default function AddEntityModal({
  addProject,
  addWorker,
  defaultType = "project",
  label = "+ Add",
}: any) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isProject = defaultType === "project"

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (isProject) {
        await addProject(formData)
      } else {
        await addWorker(formData)
      }

      setOpen(false)
      toast.success(isProject ? "Project added" : "Worker added")
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary px-4 py-1.5">
        {label}
      </button>

      {open && (
        <div className="modal-backdrop">
          <form action={handleSubmit} className="modal p-6 space-y-4">
            <h2 className="section-title">{isProject ? "Add Project" : "Add Worker"}</h2>

            <div>
              <label className="label">{isProject ? "Project Name" : "Worker Name"}</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="label">{isProject ? "Location" : "Team"}</label>
              <input name={isProject ? "location" : "team"} required className="input" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                Cancel
              </button>
              <button disabled={pending} className="btn-primary">
                {pending ? "Adding..." : isProject ? "Add Project" : "Add Worker"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
