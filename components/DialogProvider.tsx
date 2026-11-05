"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { AlertTriangle, HelpCircle } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

// Styled replacements for window.confirm / window.prompt, so questions look
// like the rest of the app instead of a grey "localhost says…" box.
//
//   const { confirm, prompt } = useDialog()
//   if (!(await confirm({ title: "Delete?", danger: true }))) return
//   const name = await prompt({ title: "New name", defaultValue: "…" })

type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean // red button + warning icon, for deletes
}

type PromptOptions = {
  title: string
  message?: string
  label?: string
  defaultValue?: string
  confirmLabel?: string
}

type Request =
  | ({ kind: "confirm"; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: "prompt"; resolve: (value: string | null) => void } & PromptOptions)

const DialogContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
} | null>(null)

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>")
  return ctx
}

export default function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ kind: "confirm", resolve, ...options })),
    []
  )
  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => setRequest({ kind: "prompt", resolve, ...options })),
    []
  )

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {request && <Dialog request={request} onDone={() => setRequest(null)} />}
    </DialogContext.Provider>
  )
}

function Dialog({ request, onDone }: { request: Request; onDone: () => void }) {
  const { t } = useLanguage()
  const [value, setValue] = useState(request.kind === "prompt" ? (request.defaultValue ?? "") : "")
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const danger = request.kind === "confirm" && request.danger

  const cancel = () => {
    if (request.kind === "confirm") request.resolve(false)
    else request.resolve(null)
    onDone()
  }
  const accept = () => {
    if (request.kind === "confirm") request.resolve(true)
    else {
      if (!value.trim()) return
      request.resolve(value.trim())
    }
    onDone()
  }

  useEffect(() => {
    if (request.kind === "prompt") inputRef.current?.select()
    else confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancel()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="modal-backdrop z-[60]" onClick={cancel}>
      <form
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          accept()
        }}
        className="modal space-y-4 p-6"
      >
        <div className="flex gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-700"
            }`}
          >
            {danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
          </span>
          <div className="min-w-0 pt-1.5">
            <h2 className="section-title leading-snug">{request.title}</h2>
            {request.message && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{request.message}</p>}
          </div>
        </div>

        {request.kind === "prompt" && (
          <div>
            {request.label && <label className="label">{request.label}</label>}
            <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} className="input" />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={cancel} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={request.kind === "prompt" && !value.trim()}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {request.confirmLabel ?? (danger ? t("Delete", "ลบ") : t("OK", "ตกลง"))}
          </button>
        </div>
      </form>
    </div>
  )
}
