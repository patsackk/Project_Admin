"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import toast from "react-hot-toast"
import { Plus, X } from "lucide-react"
import { saveStatusUpdate } from "@/app/status/actions"

type ClientOption = { id: number; name: string; projectId: number | null }
type ProjectOption = { id: number; name: string }
type UpdateOption = {
  id: number
  clientId: number | null
  clientName: string | null
  projectId: number | null
  projectName: string | null
  status: string
  percentComplete: number
  notes: string
  photos: string[]
  isDraft: boolean
  createdAt: string
}

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"]

function statusBadgeClass(status: string) {
  if (status === "Completed") return "bg-green-100 text-green-700"
  if (status === "In Progress") return "bg-sky-100 text-sky-700"
  return "bg-gray-100 text-gray-600"
}

export default function StatusUpdateForm({
  clients,
  projects,
  updates,
}: {
  clients: ClientOption[]
  projects: ProjectOption[]
  updates: UpdateOption[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clientQuery, setClientQuery] = useState("")
  const [showClientOptions, setShowClientOptions] = useState(false)
  const [clientId, setClientId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [status, setStatus] = useState(STATUS_OPTIONS[0])
  const [notes, setNotes] = useState("")
  const [percent, setPercent] = useState(0)
  const [photoNames, setPhotoNames] = useState<string[]>([])
  const [keptPhotos, setKeptPhotos] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateOption | null>(null)
  const [editingUpdate, setEditingUpdate] = useState<UpdateOption | null>(null)

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim()) return clients
    const q = clientQuery.toLowerCase()
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, clientQuery])

  // Scoped to whichever client/project is currently selected — never a
  // mixed feed of every client's updates at once. Nothing selected means
  // nothing shown yet.
  const filteredUpdates = useMemo(() => {
    if (!clientId && !projectId) return []
    return updates.filter((u) => {
      if (clientId && u.clientId !== clientId) return false
      if (projectId && u.projectId !== projectId) return false
      return true
    })
  }, [updates, clientId, projectId])

  const selectedProjectName = projects.find((p) => p.id === projectId)?.name ?? null

  const selectClient = (c: ClientOption) => {
    setClientId(c.id)
    setClientQuery(c.name)
    setShowClientOptions(false)
    if (c.projectId) setProjectId(c.projectId)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setPhotoNames(Array.from(files).map((f) => f.name))
  }

  const resetForm = () => {
    formRef.current?.reset()
    setClientId(null)
    setClientQuery("")
    setProjectId(null)
    setStatus(STATUS_OPTIONS[0])
    setNotes("")
    setPercent(0)
    setPhotoNames([])
    setKeptPhotos([])
    setEditingUpdate(null)
  }

  // A draft is still private — safe to load back into the form and
  // resave. A posted update is part of the client-visible record, so
  // clicking it only opens the read-only detail view below instead.
  const startEdit = (u: UpdateOption) => {
    setEditingUpdate(u)
    setClientId(u.clientId)
    setClientQuery(u.clientName ?? "")
    setProjectId(u.projectId)
    setStatus(u.status)
    setNotes(u.notes)
    setPercent(u.percentComplete)
    setPhotoNames([])
    setKeptPhotos(u.photos)
  }

  const removeKeptPhoto = (src: string) => {
    setKeptPhotos((prev) => prev.filter((p) => p !== src))
  }

  const submit = (intent: "draft" | "post") => {
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    formData.set("intent", intent)
    if (clientId) formData.set("clientId", String(clientId))
    if (projectId) formData.set("projectId", String(projectId))
    if (editingUpdate) {
      formData.set("id", String(editingUpdate.id))
      formData.set("keepPhotos", JSON.stringify(keptPhotos))
    }

    startTransition(async () => {
      const result = await saveStatusUpdate(formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(intent === "draft" ? "Draft saved" : "Posted — now visible to the client")
      resetForm()
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {editingUpdate ? "Editing Draft" : "Progress Submission Form"}
          </h2>
          {editingUpdate && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Cancel edit — start a new update
            </button>
          )}
        </div>

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Client search */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select Client
              </label>
              <input
                type="text"
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value)
                  setClientId(null)
                  setShowClientOptions(true)
                }}
                onFocus={() => setShowClientOptions(true)}
                onBlur={() => setTimeout(() => setShowClientOptions(false), 100)}
                placeholder="Search client database..."
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              />
              {showClientOptions && filteredClients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-sky-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select Project
              </label>
              <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </label>
              <select
                name="status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Percent complete */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Percent Complete ({percent}%)
              </label>
              <input
                type="range"
                name="percentComplete"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="mt-3 w-full accent-sky-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Detail Notes
            </label>
            <textarea
              name="notes"
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the specific progress made since the last update. Mention any milestones reached or challenges overcome..."
              className="mt-1 w-full border rounded-lg p-3 text-sm resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Upload Photos
            </label>
            {keptPhotos.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {keptPhotos.map((src) => (
                  <div key={src} className="relative group">
                    <img
                      src={src}
                      alt="Existing progress photo"
                      className="w-full h-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeKeptPhoto(src)}
                      aria-label="Remove photo"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const files = e.dataTransfer.files
                if (fileInputRef.current) fileInputRef.current.files = files
                handleFiles(files)
              }}
              className="mt-1 cursor-pointer border-2 border-dashed rounded-xl py-8 text-center hover:bg-gray-50 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                name="photos"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-sky-50 text-sky-600 mb-2">
                <Plus size={18} />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {photoNames.length > 0
                  ? `${photoNames.length} new photo${photoNames.length > 1 ? "s" : ""} to add`
                  : "Drag & drop photos or click to browse"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {keptPhotos.length > 0
                  ? "Adds to the photos above — remove any you no longer want by hovering and tapping the ✕."
                  : "High-res JPG or PNG, max 10MB each"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("draft")}
              className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit("post")}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-50"
            >
              {isPending ? "Posting..." : "Post Update & Notify Client"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Recent Status Updates</h2>
        <p className="text-xs text-gray-400 mb-4">
          {clientId || projectId
            ? `Showing history for ${[clientQuery || null, selectedProjectName].filter(Boolean).join(" · ")} — drafts are editable, posted updates are locked.`
            : "Select a client or project above to see its update history."}
        </p>

        {(clientId || projectId) && filteredUpdates.length === 0 ? (
          <p className="text-sm text-gray-400">No updates posted yet for this selection.</p>
        ) : (
          <div className="divide-y">
            {filteredUpdates.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => (u.isDraft ? startEdit(u) : setSelectedUpdate(u))}
                className="w-full py-4 flex flex-wrap items-start justify-between gap-3 text-left hover:bg-gray-50 transition rounded-lg px-2 -mx-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${statusBadgeClass(u.status)}`}>
                      {u.status}
                    </span>
                    {u.isDraft && (
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                        Draft — click to edit
                      </span>
                    )}
                    {u.photos.length > 0 && (
                      <span className="text-gray-400">
                        {u.photos.length} photo{u.photos.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">
                    {u.projectName ?? u.clientName ?? "Update"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 max-w-2xl line-clamp-2">{u.notes}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Completion</p>
                  <p className="text-sm font-bold text-sky-700">{u.percentComplete}%</p>
                  <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${u.percentComplete}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUpdate && (
        <div
          onClick={() => setSelectedUpdate(null)}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(selectedUpdate.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold ${statusBadgeClass(selectedUpdate.status)}`}
                  >
                    {selectedUpdate.status}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-1">
                  {selectedUpdate.projectName ?? selectedUpdate.clientName ?? "Update"}
                </h3>
                {selectedUpdate.clientName && selectedUpdate.projectName && (
                  <p className="text-xs text-gray-400 mt-0.5">Client: {selectedUpdate.clientName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedUpdate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs bg-gray-50 text-gray-500 rounded-lg px-3 py-2">
                This update has been posted to the client and can no longer be edited. Post a
                follow-up update instead if something needs correcting.
              </p>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Completion
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600"
                      style={{ width: `${selectedUpdate.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-sky-700">
                    {selectedUpdate.percentComplete}%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Detail Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedUpdate.notes}</p>
              </div>

              {selectedUpdate.photos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Photos
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUpdate.photos.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt="Progress photo"
                          className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
