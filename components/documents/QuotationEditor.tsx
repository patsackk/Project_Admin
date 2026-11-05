"use client"

import { useEffect, useState, useTransition } from "react"
import NumberInput from "@/components/documents/NumberInput"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Heading, ListPlus, Plus, Save, Trash2, X } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import Tooltip from "@/components/Tooltip"
import { useDialog } from "@/components/DialogProvider"
import type { ClientOption } from "@/lib/documents-server"
import {
  amountInWords,
  DEFAULT_PAYMENT_TERMS,
  emptyLine,
  formatMoney,
  formatNumber,
  groupNumbers,
  isPriced,
  lineCosts,
  QUOTATION_STATUSES,
  quotationLabel,
  quotationNumber,
  quotationTotals,
  sectionLetter,
  sectionTotals,
  UNITS,
  type PaymentStage,
  type QuoteLine,
  type QuoteLineKind,
  type QuoteSection,
} from "@/lib/documents"
import { saveQuotation, type QuotationInput } from "@/app/documents/actions"
import { quotationStatusLabel } from "@/components/documents/DocumentLists"

type ProjectOption = { id: number; name: string; location: string }

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function QuotationEditor({
  id,
  initial,
  projects,
  clients,
  nextSeq,
}: {
  id: number | null
  initial: QuotationInput
  projects: ProjectOption[]
  clients: ClientOption[]
  nextSeq: number
}) {
  const { t } = useLanguage()
  const dialog = useDialog()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(initial)
  const [numberTouched, setNumberTouched] = useState(id !== null)
  const [dirty, setDirty] = useState(false)

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = (patch: Partial<QuotationInput>) => {
    setDirty(true)
    setForm((f) => {
      const next = { ...f, ...patch }
      // The number follows the project name until someone types their own.
      if (!numberTouched && patch.projectName !== undefined) {
        next.number = quotationNumber(patch.projectName, nextSeq, new Date(next.date).getFullYear() || new Date().getFullYear())
      }
      return next
    })
  }

  const setSections = (fn: (s: QuoteSection[]) => QuoteSection[]) => update({ sections: fn(form.sections) })
  const setSection = (si: number, patch: Partial<QuoteSection>) =>
    setSections((all) => all.map((s, i) => (i === si ? { ...s, ...patch } : s)))
  const setLines = (si: number, fn: (lines: QuoteLine[]) => QuoteLine[]) =>
    setSections((all) => all.map((s, i) => (i === si ? { ...s, lines: fn(s.lines) } : s)))
  const setLine = (si: number, li: number, patch: Partial<QuoteLine>) =>
    setLines(si, (lines) => lines.map((l, i) => (i === li ? { ...l, ...patch } : l)))

  const setPayment = (fn: (p: PaymentStage[]) => PaymentStage[]) => update({ paymentTerms: fn(form.paymentTerms) })

  const pickClient = (clientId: string) => {
    const c = clients.find((x) => String(x.id) === clientId)
    if (!c) return
    update({
      clientName: c.name,
      clientEmail: c.email,
      clientAddress: c.address ?? "",
      ...(c.projectName ? { projectName: c.projectName, projectId: c.projectId } : {}),
    })
  }

  const pickProject = (name: string) => {
    const p = projects.find((x) => x.name === name)
    update({ projectName: name, projectId: p?.id ?? null })
  }

  const totals = quotationTotals(form.sections, form.overheadPct, form.vatPct)
  const paymentSum = form.paymentTerms.reduce((s, p) => s + p.percent, 0)

  const save = (thenView: boolean) =>
    startTransition(async () => {
      const result = await saveQuotation(id, form)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setDirty(false)
      toast.success(t("Quotation saved", "บันทึกใบเสนอราคาแล้ว"))
      if (thenView) router.push(`/documents/quotations/${result.id}/print`)
      else if (id === null) router.replace(`/documents/quotations/${result.id}`)
      else router.refresh()
    })

  const kindLabel = (kind: QuoteLineKind) =>
    ({
      group: t("Numbered (price optional)", "หัวข้อมีเลข (ใส่ราคาได้)"),
      heading: t("Sub-heading", "หัวข้อย่อย"),
      item: t("Item", "รายการ"),
    })[kind]

  return (
    <div className="page">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/documents" className="back-link">
            <ArrowLeft size={16} /> {t("Quotations & Invoices", "ใบเสนอราคาและใบแจ้งหนี้")}
          </Link>
          <h1 className="page-title mt-2">
            {id === null
              ? t("New quotation", "สร้างใบเสนอราคา")
              : t(`Edit ${quotationLabel(initial.number, initial.revision)}`, `แก้ไข ${quotationLabel(initial.number, initial.revision)}`)}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={pending} className="btn-secondary">
            <Save size={16} /> {pending ? t("Saving…", "กำลังบันทึก…") : t("Save", "บันทึก")}
          </button>
          <button onClick={() => save(true)} disabled={pending} className="btn-primary">
            <Eye size={16} /> {t("Save & view", "บันทึกและดูเอกสาร")}
          </button>
        </div>
      </div>

      {/* Details */}
      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{t("Details", "รายละเอียด")}</h2>
          {clients.length > 0 && (
            <select value="" onChange={(e) => pickClient(e.target.value)} className="input sm:w-72">
              <option value="">{t("Fill in from a client…", "ดึงข้อมูลจากลูกค้า…")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.projectName && ` — ${c.projectName}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="label">{t("Project name", "ชื่อโครงการ")} *</label>
            <input
              list="project-options"
              value={form.projectName}
              onChange={(e) => pickProject(e.target.value)}
              placeholder="DC HOUSE"
              className="input"
            />
            <datalist id="project-options">
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.location}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">{t("Quotation no.", "เลขที่ใบเสนอราคา")} *</label>
            <input
              value={form.number}
              onChange={(e) => {
                setNumberTouched(true)
                update({ number: e.target.value })
              }}
              className="input font-mono"
            />
          </div>
          <div>
            <label className="label">{t("Revision (R)", "รีวิชัน (R)")}</label>
            <NumberInput value={form.revision} onChange={(n) => update({ revision: Math.max(0, Math.round(n)) })} className="text-left" />
          </div>

          <div>
            <label className="label">{t("Client", "ลูกค้า")} *</label>
            <input value={form.clientName} onChange={(e) => update({ clientName: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("Client email", "อีเมลลูกค้า")}</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => update({ clientEmail: e.target.value })}
              placeholder={t("for sending", "สำหรับส่งเอกสาร")}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("Date", "วันที่")} *</label>
            <input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("Status", "สถานะ")}</label>
            <select
              value={form.status}
              onChange={(e) => update({ status: e.target.value as QuotationInput["status"] })}
              className="input"
            >
              {QUOTATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {quotationStatusLabel(s, t)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("Address", "ที่อยู่")}</label>
            <textarea
              rows={2}
              value={form.clientAddress}
              onChange={(e) => update({ clientAddress: e.target.value })}
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t("Subject", "เรื่อง")}</label>
            <input
              value={form.subject}
              onChange={(e) => update({ subject: e.target.value })}
              placeholder="Plumbing and Aircondition work"
              className="input"
            />
          </div>

          <div>
            <label className="label">{t("Valid for (days)", "ยืนราคา (วัน)")}</label>
            <NumberInput value={form.validityDays} onChange={(n) => update({ validityDays: n })} className="text-left" />
          </div>
          <div>
            <label className="label">{t("Overhead & profit %", "ค่าดำเนินการและกำไร %")}</label>
            <NumberInput value={form.overheadPct} onChange={(n) => update({ overheadPct: n })} className="text-left" />
          </div>
          <div>
            <label className="label">{t("VAT %", "ภาษีมูลค่าเพิ่ม %")}</label>
            <NumberInput value={form.vatPct} onChange={(n) => update({ vatPct: n })} className="text-left" />
          </div>
        </div>
      </section>

      {/* Sections (A, B, C…) */}
      <datalist id="unit-options">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {form.sections.map((section, si) => {
        const numbers = groupNumbers(section.lines)
        const st = sectionTotals(section)
        return (
          <section key={si} className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-sky-50/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 font-bold text-white">
                {sectionLetter(si)}
              </span>
              <input
                value={section.title}
                onChange={(e) => setSection(si, { title: e.target.value })}
                placeholder={t("Section title, e.g. AIR CONDITION SYSTEM", "ชื่อหมวด เช่น AIR CONDITION SYSTEM")}
                className="input min-w-0 flex-1 font-semibold uppercase"
              />
              <span className="text-sm font-semibold text-gray-700">฿{formatMoney(st.amount)}</span>
              <div className="flex gap-0.5">
                <Tooltip label={t("Move up", "เลื่อนขึ้น")}>
                  <button onClick={() => setSections((all) => move(all, si, si - 1))} disabled={si === 0} className="btn-ghost px-2" aria-label={t("Move up", "เลื่อนขึ้น")}>
                    <ArrowUp size={16} />
                  </button>
                </Tooltip>
                <Tooltip label={t("Move down", "เลื่อนลง")}>
                  <button onClick={() => setSections((all) => move(all, si, si + 1))} disabled={si === form.sections.length - 1} className="btn-ghost px-2" aria-label={t("Move down", "เลื่อนลง")}>
                    <ArrowDown size={16} />
                  </button>
                </Tooltip>
                <Tooltip label={t("Remove section", "ลบหมวด")}>
                  <button
                    onClick={async () => {
                      const ok =
                        section.lines.length === 0 ||
                        (await dialog.confirm({
                          title: t(`Remove section ${sectionLetter(si)}?`, `ลบหมวด ${sectionLetter(si)}?`),
                          message: t(
                            `“${section.title || "Untitled"}” and its ${section.lines.length} lines will be removed. Nothing is saved until you click Save.`,
                            `“${section.title || "ไม่มีชื่อ"}” และรายการ ${section.lines.length} บรรทัดจะถูกลบ ยังไม่บันทึกจนกว่าจะกดบันทึก`
                          ),
                          confirmLabel: t("Remove", "ลบ"),
                          danger: true,
                        }))
                      if (ok) setSections((all) => all.filter((_, i) => i !== si))
                    }}
                    className="btn-ghost px-2 hover:text-red-600"
                    aria-label={t("Remove section", "ลบหมวด")}
                  >
                    <Trash2 size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="w-10 p-2">No.</th>
                    <th className="p-2 text-left">{t("Description", "รายการ")}</th>
                    <th className="w-20 p-2 text-right">{t("Qty", "จำนวน")}</th>
                    <th className="w-20 p-2 text-left">{t("Unit", "หน่วย")}</th>
                    <th className="w-28 p-2 text-right">{t("Mat. unit cost", "ค่าวัสดุ/หน่วย")}</th>
                    <th className="w-28 p-2 text-right">{t("Labour unit cost", "ค่าแรง/หน่วย")}</th>
                    <th className="w-32 p-2 text-left">{t("Note", "หมายเหตุ")}</th>
                    <th className="w-28 p-2 text-right">{t("Amount", "จำนวนเงิน")}</th>
                    <th className="w-24 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {section.lines.map((line, li) => {
                    const isItem = line.kind === "item"
                    const hasPrice = line.kind !== "heading"
                    return (
                      <tr key={li} className={`border-t border-gray-100 align-top ${isItem ? "" : "bg-gray-50/70"}`}>
                        <td className="p-2 text-center text-xs font-semibold text-gray-500">
                          <Tooltip
                            label={kindLabel(line.kind)}
                            hint={t("Click to change: numbered, sub-heading or item", "คลิกเพื่อเปลี่ยน: หัวข้อมีเลข หัวข้อย่อย หรือรายการ")}
                            align="left"
                          >
                            <select
                              value={line.kind}
                              onChange={(e) => setLine(si, li, { kind: e.target.value as QuoteLineKind })}
                              className="w-full cursor-pointer appearance-none bg-transparent text-center font-semibold text-gray-600"
                              aria-label={kindLabel(line.kind)}
                            >
                              <option value="group">{numbers[li] ?? "#"}</option>
                              <option value="heading">H</option>
                              <option value="item">–</option>
                            </select>
                          </Tooltip>
                        </td>
                        <td className="p-2">
                          <textarea
                            rows={Math.max(1, line.description.split("\n").length)}
                            value={line.description}
                            onChange={(e) => setLine(si, li, { description: e.target.value })}
                            placeholder={
                              isItem
                                ? t("e.g. Copper tube Dia 3/8\"", "เช่น ท่อทองแดง 3/8\"")
                                : t("Heading, e.g. REFRIGERANT PIPE", "หัวข้อ เช่น REFRIGERANT PIPE")
                            }
                            className={`input resize-y px-2 py-1 ${isItem ? "" : "font-semibold"}`}
                          />
                        </td>
                        {hasPrice ? (
                          <>
                            <td className="p-2">
                              <NumberInput value={line.qty} onChange={(n) => setLine(si, li, { qty: n })} />
                            </td>
                            <td className="p-2">
                              <input
                                list="unit-options"
                                value={line.unit}
                                onChange={(e) => setLine(si, li, { unit: e.target.value })}
                                className="input px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <NumberInput value={line.matUnit} onChange={(n) => setLine(si, li, { matUnit: n })} />
                            </td>
                            <td className="p-2">
                              <NumberInput value={line.labourUnit} onChange={(n) => setLine(si, li, { labourUnit: n })} />
                            </td>
                            <td className="p-2">
                              <input
                                list="note-options"
                                value={line.note}
                                onChange={(e) => setLine(si, li, { note: e.target.value })}
                                placeholder={t("optional", "ถ้ามี")}
                                className="input px-2 py-1"
                              />
                            </td>
                            <td className="whitespace-nowrap p-2 pt-3 text-right font-medium">
                              {isPriced(line) ? formatMoney(lineCosts(line).amount) : ""}
                            </td>
                          </>
                        ) : (
                          <td colSpan={6} className="p-2 pt-3 text-xs text-gray-400">
                            {kindLabel(line.kind)}
                          </td>
                        )}
                        <td className="p-2">
                          <div className="flex justify-end">
                            <Tooltip label={t("Move up", "เลื่อนขึ้น")}>
                              <button onClick={() => setLines(si, (l) => move(l, li, li - 1))} disabled={li === 0} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" aria-label={t("Move up", "เลื่อนขึ้น")}>
                                <ArrowUp size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip label={t("Move down", "เลื่อนลง")}>
                              <button onClick={() => setLines(si, (l) => move(l, li, li + 1))} disabled={li === section.lines.length - 1} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" aria-label={t("Move down", "เลื่อนลง")}>
                                <ArrowDown size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip label={t("Insert item below", "แทรกรายการด้านล่าง")}>
                              <button
                                onClick={() => setLines(si, (l) => [...l.slice(0, li + 1), { ...emptyLine("item"), unit: line.unit || "Set" }, ...l.slice(li + 1)])}
                                className="rounded p-1 text-gray-400 hover:bg-sky-100 hover:text-sky-700"
                                aria-label={t("Insert item below", "แทรกรายการด้านล่าง")}
                              >
                                <Plus size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip label={t("Remove line", "ลบบรรทัด")}>
                              <button onClick={() => setLines(si, (l) => l.filter((_, i) => i !== li))} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={t("Remove line", "ลบบรรทัด")}>
                                <X size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 p-3">
              <button onClick={() => setLines(si, (l) => [...l, emptyLine("item")])} className="btn-ghost">
                <Plus size={16} /> {t("Item", "รายการ")}
              </button>
              <button onClick={() => setLines(si, (l) => [...l, emptyLine("group")])} className="btn-ghost">
                <ListPlus size={16} /> {t("Numbered group", "หัวข้อมีเลข")}
              </button>
              <button onClick={() => setLines(si, (l) => [...l, emptyLine("heading")])} className="btn-ghost">
                <Heading size={16} /> {t("Sub-heading", "หัวข้อย่อย")}
              </button>
              <span className="ml-auto text-xs text-gray-500">
                {t("Material", "วัสดุ")} {formatMoney(st.mat)} · {t("Labour", "ค่าแรง")} {formatMoney(st.labour)}
              </span>
            </div>
          </section>
        )
      })}

      <datalist id="note-options">
        {["Included", "By Owner", "By other", "Existing system", "Not included"].map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <button
        onClick={() => setSections((all) => [...all, { title: "", lines: [emptyLine("group"), emptyLine("item")] }])}
        disabled={form.sections.length >= 26}
        className="btn-secondary w-full border-dashed"
      >
        <Plus size={16} /> {t(`Add section ${sectionLetter(form.sections.length)}`, `เพิ่มหมวด ${sectionLetter(form.sections.length)}`)}
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment & conditions */}
        <section className="card space-y-5 p-6">
          <div>
            <h2 className="section-title">{t("Payment stages", "งวดการชำระเงิน")}</h2>
            <p className="text-xs text-gray-500">
              {t(
                "Printed as “Term of payment”, and used to bill each stage as an invoice.",
                "แสดงเป็น “Term of payment” ในเอกสาร และใช้ออกใบแจ้งหนี้แต่ละงวด"
              )}
            </p>
          </div>
          <div className="space-y-2">
            {form.paymentTerms.map((p, pi) => (
              <div key={pi} className="flex items-center gap-2">
                <input
                  value={p.label}
                  onChange={(e) => setPayment((all) => all.map((x, i) => (i === pi ? { ...x, label: e.target.value } : x)))}
                  className="input flex-1"
                />
                <div className="relative w-28">
                  <NumberInput
                    value={p.percent}
                    onChange={(n) => setPayment((all) => all.map((x, i) => (i === pi ? { ...x, percent: n } : x)))}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
                <button onClick={() => setPayment((all) => all.filter((_, i) => i !== pi))} className="btn-ghost px-2 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button onClick={() => setPayment((all) => [...all, { label: "", percent: 0 }])} className="btn-ghost">
                <Plus size={16} /> {t("Add stage", "เพิ่มงวด")}
              </button>
              {form.paymentTerms.length === 0 ? (
                <button onClick={() => setPayment(() => DEFAULT_PAYMENT_TERMS)} className="text-xs text-sky-700 hover:underline">
                  {t("Use 30 / 60 / 10", "ใช้ 30 / 60 / 10")}
                </button>
              ) : (
                <span className={`text-sm font-semibold ${paymentSum === 100 ? "text-green-600" : "text-amber-600"}`}>
                  {t("Total", "รวม")} {formatNumber(paymentSum)}%{paymentSum !== 100 && t(" (should be 100%)", " (ควรเป็น 100%)")}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="label">{t("General conditions", "เงื่อนไขทั่วไป")}</label>
            <textarea
              rows={12}
              value={form.conditions}
              onChange={(e) => update({ conditions: e.target.value })}
              className="input font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t(
                "A line on its own is a numbered heading; lines starting with “-” are its points. {number} becomes the quotation number. Payment stages are added as heading 2.",
                "บรรทัดปกติคือหัวข้อ (มีเลขอัตโนมัติ) บรรทัดที่ขึ้นต้นด้วย “-” คือข้อย่อย {number} จะแทนด้วยเลขที่ใบเสนอราคา งวดการชำระเงินจะถูกใส่เป็นหัวข้อที่ 2"
              )}
            </p>
          </div>
        </section>

        {/* Totals */}
        <section className="card h-fit space-y-3 p-6 lg:sticky lg:top-4">
          <h2 className="section-title">{t("Summary", "สรุปยอด")}</h2>
          <dl className="space-y-1.5 text-sm">
            {form.sections.map((s, i) => (
              <div key={i} className="flex justify-between gap-4 text-gray-600">
                <dt className="truncate">
                  {sectionLetter(i)} {s.title || t("(untitled)", "(ไม่มีชื่อ)")}
                </dt>
                <dd className="whitespace-nowrap">{formatMoney(totals.perSection[i].amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt>{t("Sub total cost", "รวมต้นทุน")}</dt>
              <dd className="font-medium">{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t(`Overhead & profit ${formatNumber(form.overheadPct)}%`, `ค่าดำเนินการและกำไร ${formatNumber(form.overheadPct)}%`)}</dt>
              <dd>{formatMoney(totals.overhead)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("Total cost", "รวมเป็นเงิน")}</dt>
              <dd className="font-medium">{formatMoney(totals.totalCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t(`VAT ${formatNumber(form.vatPct)}%`, `ภาษีมูลค่าเพิ่ม ${formatNumber(form.vatPct)}%`)}</dt>
              <dd>{formatMoney(totals.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <dt>{t("Grand total", "ยอดรวมสุทธิ")}</dt>
              <dd>฿{formatMoney(totals.grandTotal)}</dd>
            </div>
          </dl>
          <p className="text-xs italic text-gray-500">({amountInWords(totals.grandTotal)})</p>

          <div className="flex gap-2 pt-2">
            <button onClick={() => save(false)} disabled={pending} className="btn-secondary flex-1">
              <Save size={16} /> {t("Save", "บันทึก")}
            </button>
            <button onClick={() => save(true)} disabled={pending} className="btn-primary flex-1">
              <Eye size={16} /> {t("Save & view", "บันทึกและดูเอกสาร")}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
