"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { CheckCircle2, Copy, Eye, GitBranch, Pencil, Plus, Receipt, RotateCcw, Search, Trash2 } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import { useDialog } from "@/components/DialogProvider"
import Pagination from "@/components/Pagination"
import SendEmailButton from "@/components/documents/SendEmailButton"
import Tooltip from "@/components/Tooltip"
import type { Translate } from "@/lib/i18n"
import {
  formatMoney,
  formatThaiDate,
  INVOICE_STATUSES,
  QUOTATION_STATUSES,
  quotationNumber,
  type InvoiceStatus,
  type QuotationStatus,
} from "@/lib/documents"
import {
  deleteInvoice,
  deleteQuotation,
  duplicateQuotation,
  reviseQuotation,
  setInvoiceStatus,
  setQuotationStatus,
} from "@/app/documents/actions"

export type QuotationRow = {
  id: number
  label: string
  projectName: string
  clientName: string
  clientEmail: string
  subject: string
  date: string
  sentAt: string | null
  sentTo: string
  grandTotal: number
  status: QuotationStatus
  invoiceCount: number
}

export type InvoiceRow = {
  id: number
  number: string
  quotationLabel: string
  stageLabel: string
  clientName: string
  clientEmail: string
  projectName: string
  date: string
  sentAt: string | null
  sentTo: string
  dueDate: string | null
  netPayable: number
  status: InvoiceStatus
  overdue: boolean
}

const PAGE_SIZE = 15

export function quotationStatusLabel(status: QuotationStatus, t: Translate) {
  return {
    draft: t("Draft", "ฉบับร่าง"),
    sent: t("Sent", "ส่งแล้ว"),
    approved: t("Approved", "อนุมัติแล้ว"),
    rejected: t("Rejected", "ไม่อนุมัติ"),
  }[status]
}

export function invoiceStatusLabel(status: InvoiceStatus, t: Translate) {
  return { unpaid: t("Unpaid", "ยังไม่ชำระ"), paid: t("Paid", "ชำระแล้ว") }[status]
}

const QUOTATION_BADGE: Record<QuotationStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-sky-100 text-sky-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
}

export default function DocumentLists({
  tab,
  quotations,
  invoices,
  canManage,
  nextSeq,
}: {
  tab: "quotations" | "invoices"
  quotations: QuotationRow[]
  invoices: InvoiceRow[]
  canManage: boolean
  nextSeq: number
}) {
  const { t } = useLanguage()

  const approvedValue = quotations.filter((q) => q.status === "approved").reduce((s, q) => s + q.grandTotal, 0)
  const unpaid = invoices.filter((i) => i.status === "unpaid")
  const unpaidValue = unpaid.reduce((s, i) => s + i.netPayable, 0)
  const overdue = unpaid.filter((i) => i.overdue).length

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-sky-100"
    }`

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">{t("Approved quotations", "ใบเสนอราคาที่อนุมัติแล้ว")}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">฿{formatMoney(approvedValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">{t("Waiting for payment", "รอรับชำระ")}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">฿{formatMoney(unpaidValue)}</p>
          <p className="text-xs text-gray-500">
            {t(`${unpaid.length} unpaid invoices`, `ใบแจ้งหนี้ค้างชำระ ${unpaid.length} ใบ`)}
          </p>
        </div>
        <div className={`card p-4 ${overdue > 0 ? "border-red-200 bg-red-50" : ""}`}>
          <p className="text-xs text-gray-500">{t("Overdue invoices", "ใบแจ้งหนี้เกินกำหนด")}</p>
          <p className={`mt-1 text-xl font-bold ${overdue > 0 ? "text-red-600" : "text-gray-900"}`}>{overdue}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
          <Link href="/documents" className={tabClass(tab === "quotations")}>
            {t("Quotations", "ใบเสนอราคา")} ({quotations.length})
          </Link>
          <Link href="/documents?tab=invoices" className={tabClass(tab === "invoices")}>
            {t("Invoices", "ใบแจ้งหนี้")} ({invoices.length})
          </Link>
        </div>

        {canManage &&
          (tab === "quotations" ? (
            <Link href="/documents/quotations/new" className="btn-primary">
              <Plus size={16} /> {t("New quotation", "สร้างใบเสนอราคา")}
            </Link>
          ) : (
            <Link href="/documents/invoices/new" className="btn-primary">
              <Plus size={16} /> {t("New invoice", "สร้างใบแจ้งหนี้")}
            </Link>
          ))}
      </div>

      {tab === "quotations" ? (
        <QuotationTable rows={quotations} canManage={canManage} nextSeq={nextSeq} />
      ) : (
        <InvoiceTable rows={invoices} canManage={canManage} />
      )}
    </div>
  )
}

function useSearch<T>(rows: T[], text: (row: T) => string, status: (row: T) => string) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) => (statusFilter === "all" || status(r) === statusFilter) && (!q || text(r).toLowerCase().includes(q))
    )
  }, [rows, query, statusFilter, text, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)

  return {
    query,
    setQuery: (v: string) => {
      setQuery(v)
      setPage(1)
    },
    statusFilter,
    setStatusFilter: (v: string) => {
      setStatusFilter(v)
      setPage(1)
    },
    page: current,
    setPage,
    filtered,
    visible: filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
  }
}

function Toolbar({
  query,
  onQuery,
  status,
  onStatus,
  options,
}: {
  query: string
  onQuery: (v: string) => void
  status: string
  onStatus: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("Search number, project or client…", "ค้นหาเลขที่ โครงการ หรือลูกค้า…")}
          className="input pl-9"
        />
      </div>
      <select value={status} onChange={(e) => onStatus(e.target.value)} className="input sm:w-48">
        <option value="all">{t("All statuses", "ทุกสถานะ")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Hover colours are kept separate so a red/green variant doesn't fight the
// default blue (both would be in the class list, and blue would win).
const iconBase =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition disabled:opacity-50"
const iconButton = `${iconBase} hover:bg-sky-100 hover:text-sky-700`

function SentNote({ sentAt, sentTo }: { sentAt: string | null; sentTo: string }) {
  const { t } = useLanguage()
  if (!sentAt) return null
  return (
    <p className="mt-1 text-xs text-gray-500" title={sentTo}>
      {t(`Emailed ${formatThaiDate(sentAt)}`, `ส่งอีเมลแล้ว ${formatThaiDate(sentAt)}`)}
    </p>
  )
}

const quotationText = (q: QuotationRow) => `${q.label} ${q.projectName} ${q.clientName} ${q.subject}`
const quotationStatus = (q: QuotationRow) => q.status

function QuotationTable({ rows, canManage, nextSeq }: { rows: QuotationRow[]; canManage: boolean; nextSeq: number }) {
  const { t } = useLanguage()
  const dialog = useDialog()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const s = useSearch(rows, quotationText, quotationStatus)

  const run = (action: () => Promise<{ success: boolean; error?: string; id?: number }>, after?: (id?: number) => void) =>
    startTransition(async () => {
      const result = await action()
      if (!result.success) toast.error(result.error ?? t("Something went wrong.", "เกิดข้อผิดพลาด"))
      else after?.(result.id)
    })

  const revise = (q: QuotationRow) =>
    run(
      () => reviseQuotation(q.id),
      (id) => {
        toast.success(t("New revision created. Make your changes and save.", "สร้างรีวิชันใหม่แล้ว แก้ไขแล้วกดบันทึก"))
        router.push(`/documents/quotations/${id}`)
      }
    )

  const duplicate = async (q: QuotationRow) => {
    const number = await dialog.prompt({
      title: t(`Copy ${q.label} as a new quotation`, `คัดลอก ${q.label} เป็นใบเสนอราคาใหม่`),
      message: t(
        "All sections and prices are copied. You can change the client and details next.",
        "คัดลอกทุกหมวดและราคา จากนั้นแก้ไขลูกค้าและรายละเอียดได้"
      ),
      label: t("Number for the new quotation", "เลขที่ใบเสนอราคาใหม่"),
      defaultValue: quotationNumber(q.projectName, nextSeq, new Date().getFullYear()),
      confirmLabel: t("Copy", "คัดลอก"),
    })
    if (!number) return
    run(
      () => duplicateQuotation(q.id, number),
      (id) => {
        toast.success(t("Copied. Update the details and save.", "คัดลอกแล้ว แก้ไขรายละเอียดแล้วกดบันทึก"))
        router.push(`/documents/quotations/${id}`)
      }
    )
  }

  const remove = async (q: QuotationRow) => {
    const ok = await dialog.confirm({
      title: t(`Delete quotation ${q.label}?`, `ลบใบเสนอราคา ${q.label}?`),
      message:
        t("This can't be undone.", "ลบแล้วกู้คืนไม่ได้") +
        (q.invoiceCount > 0
          ? t(
              ` Its ${q.invoiceCount} invoice(s) will be kept.`,
              ` ใบแจ้งหนี้ ${q.invoiceCount} ใบที่ออกจากใบเสนอราคานี้จะยังอยู่`
            )
          : ""),
      danger: true,
    })
    if (!ok) return
    run(() => deleteQuotation(q.id), () => toast.success(t("Quotation deleted", "ลบใบเสนอราคาแล้ว")))
  }

  return (
    <div className="card overflow-hidden">
      <Toolbar
        query={s.query}
        onQuery={s.setQuery}
        status={s.statusFilter}
        onStatus={s.setStatusFilter}
        options={QUOTATION_STATUSES.map((v) => ({ value: v, label: quotationStatusLabel(v, t) }))}
      />

      {s.filtered.length === 0 ? (
        <p className="empty-state">
          {rows.length === 0
            ? t("No quotations yet. Click “New quotation” to make the first one.", "ยังไม่มีใบเสนอราคา กด “สร้างใบเสนอราคา” เพื่อเริ่ม")
            : t("No quotations match.", "ไม่พบใบเสนอราคาที่ตรงกัน")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Quotation", "ใบเสนอราคา")}</th>
                <th>{t("Client", "ลูกค้า")}</th>
                <th>{t("Date", "วันที่")}</th>
                <th className="text-right">{t("Grand total", "ยอดรวมสุทธิ")}</th>
                <th>{t("Status", "สถานะ")}</th>
                <th className="text-right">{t("Actions", "จัดการ")}</th>
              </tr>
            </thead>
            <tbody>
              {s.visible.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/documents/quotations/${q.id}/print`} className="font-semibold text-sky-700 hover:underline">
                      {q.label}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {q.projectName}
                      {q.subject && ` · ${q.subject}`}
                    </p>
                  </td>
                  <td>{q.clientName}</td>
                  <td className="whitespace-nowrap">{formatThaiDate(q.date)}</td>
                  <td className="text-right font-medium whitespace-nowrap">{formatMoney(q.grandTotal)}</td>
                  <td>
                    {canManage ? (
                      <select
                        value={q.status}
                        disabled={pending}
                        onChange={(e) =>
                          run(() => setQuotationStatus(q.id, e.target.value as QuotationStatus))
                        }
                        className={`badge cursor-pointer border-0 py-1 ${QUOTATION_BADGE[q.status]}`}
                      >
                        {QUOTATION_STATUSES.map((v) => (
                          <option key={v} value={v}>
                            {quotationStatusLabel(v, t)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge ${QUOTATION_BADGE[q.status]}`}>{quotationStatusLabel(q.status, t)}</span>
                    )}
                    <SentNote sentAt={q.sentAt} sentTo={q.sentTo} />
                    {q.invoiceCount > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {t(`${q.invoiceCount} invoice(s)`, `ใบแจ้งหนี้ ${q.invoiceCount} ใบ`)}
                      </p>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <Tooltip label={t("View / Print", "ดู / พิมพ์")}>
                        <Link href={`/documents/quotations/${q.id}/print`} className={iconButton} aria-label={t("View / Print", "ดู / พิมพ์")}>
                          <Eye size={16} />
                        </Link>
                      </Tooltip>
                      {canManage && (
                        <>
                          <Tooltip label={t("Send by email", "ส่งทางอีเมล")}>
                            <SendEmailButton
                              variant="icon"
                              doc={{
                                kind: "quotation",
                                id: q.id,
                                label: q.label,
                                clientName: q.clientName,
                                clientEmail: q.clientEmail,
                                projectName: q.projectName,
                                subject: q.subject,
                                amount: q.grandTotal,
                                sentAt: q.sentAt,
                                sentTo: q.sentTo,
                              }}
                            />
                          </Tooltip>
                          <Tooltip label={t("Edit", "แก้ไข")}>
                            <Link href={`/documents/quotations/${q.id}`} className={iconButton} aria-label={t("Edit", "แก้ไข")}>
                              <Pencil size={16} />
                            </Link>
                          </Tooltip>
                          <Tooltip
                            label={t("Create invoice", "ออกใบแจ้งหนี้")}
                            hint={t("Bill a payment stage", "เรียกเก็บตามงวด")}
                          >
                            <Link href={`/documents/invoices/new?quotation=${q.id}`} className={iconButton} aria-label={t("Create invoice", "ออกใบแจ้งหนี้")}>
                              <Receipt size={16} />
                            </Link>
                          </Tooltip>
                          <Tooltip
                            label={t("New revision (R+1)", "สร้างรีวิชันใหม่ (R+1)")}
                            hint={t("Change it, keeping this version", "แก้ไขโดยเก็บฉบับนี้ไว้")}
                          >
                            <button onClick={() => revise(q)} disabled={pending} className={iconButton} aria-label={t("New revision (R+1)", "สร้างรีวิชันใหม่ (R+1)")}>
                              <GitBranch size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip
                            label={t("Copy as new quotation", "คัดลอกเป็นใบเสนอราคาใหม่")}
                            hint={t("Same items, new number", "รายการเดิม เลขที่ใหม่")}
                          >
                            <button onClick={() => duplicate(q)} disabled={pending} className={iconButton} aria-label={t("Copy as new quotation", "คัดลอกเป็นใบเสนอราคาใหม่")}>
                              <Copy size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip label={t("Delete", "ลบ")}>
                            <button
                              onClick={() => remove(q)}
                              disabled={pending}
                              className={`${iconBase} hover:bg-red-50 hover:text-red-600`}
                              aria-label={t("Delete", "ลบ")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-gray-100 p-4">
        <Pagination page={s.page} pageSize={PAGE_SIZE} total={s.filtered.length} onChange={s.setPage} />
      </div>
    </div>
  )
}

const invoiceText = (i: InvoiceRow) => `${i.number} ${i.quotationLabel} ${i.clientName} ${i.projectName} ${i.stageLabel}`
const invoiceStatus = (i: InvoiceRow) => i.status

function InvoiceTable({ rows, canManage }: { rows: InvoiceRow[]; canManage: boolean }) {
  const { t } = useLanguage()
  const dialog = useDialog()
  const [pending, startTransition] = useTransition()
  const s = useSearch(rows, invoiceText, invoiceStatus)

  const togglePaid = (i: InvoiceRow) =>
    startTransition(async () => {
      const next = i.status === "paid" ? "unpaid" : "paid"
      const result = await setInvoiceStatus(i.id, next)
      if (!result.success) toast.error(result.error)
      else toast.success(next === "paid" ? t("Marked as paid", "บันทึกว่าชำระแล้ว") : t("Marked as unpaid", "บันทึกว่ายังไม่ชำระ"))
    })

  const remove = async (i: InvoiceRow) => {
    const ok = await dialog.confirm({
      title: t(`Delete invoice ${i.number}?`, `ลบใบแจ้งหนี้ ${i.number}?`),
      message: t("This can't be undone.", "ลบแล้วกู้คืนไม่ได้"),
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteInvoice(i.id)
      if (!result.success) toast.error(result.error)
      else toast.success(t("Invoice deleted", "ลบใบแจ้งหนี้แล้ว"))
    })
  }

  return (
    <div className="card overflow-hidden">
      <Toolbar
        query={s.query}
        onQuery={s.setQuery}
        status={s.statusFilter}
        onStatus={s.setStatusFilter}
        options={INVOICE_STATUSES.map((v) => ({ value: v, label: invoiceStatusLabel(v, t) }))}
      />

      {s.filtered.length === 0 ? (
        <p className="empty-state">
          {rows.length === 0
            ? t(
                "No invoices yet. Make one from a quotation (the receipt icon) or click “New invoice”.",
                "ยังไม่มีใบแจ้งหนี้ ออกจากใบเสนอราคา (ไอคอนใบเสร็จ) หรือกด “สร้างใบแจ้งหนี้”"
              )
            : t("No invoices match.", "ไม่พบใบแจ้งหนี้ที่ตรงกัน")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Invoice", "ใบแจ้งหนี้")}</th>
                <th>{t("Client", "ลูกค้า")}</th>
                <th>{t("Date", "วันที่")}</th>
                <th>{t("Due", "ครบกำหนด")}</th>
                <th className="text-right">{t("Amount due", "ยอดที่ต้องชำระ")}</th>
                <th>{t("Status", "สถานะ")}</th>
                <th className="text-right">{t("Actions", "จัดการ")}</th>
              </tr>
            </thead>
            <tbody>
              {s.visible.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link href={`/documents/invoices/${i.id}/print`} className="font-semibold text-sky-700 hover:underline">
                      {i.number}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {[i.stageLabel, i.quotationLabel && t(`from ${i.quotationLabel}`, `จาก ${i.quotationLabel}`)]
                        .filter(Boolean)
                        .join(" · ") || i.projectName}
                    </p>
                  </td>
                  <td>{i.clientName}</td>
                  <td className="whitespace-nowrap">{formatThaiDate(i.date)}</td>
                  <td className={`whitespace-nowrap ${i.overdue ? "font-semibold text-red-600" : ""}`}>
                    {i.dueDate ? formatThaiDate(i.dueDate) : "–"}
                    {i.overdue && <p className="text-xs">{t("Overdue", "เกินกำหนด")}</p>}
                  </td>
                  <td className="text-right font-medium whitespace-nowrap">{formatMoney(i.netPayable)}</td>
                  <td>
                    <span className={`badge ${i.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {invoiceStatusLabel(i.status, t)}
                    </span>
                    <SentNote sentAt={i.sentAt} sentTo={i.sentTo} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <Tooltip label={t("View / Print", "ดู / พิมพ์")}>
                        <Link href={`/documents/invoices/${i.id}/print`} className={iconButton} aria-label={t("View / Print", "ดู / พิมพ์")}>
                          <Eye size={16} />
                        </Link>
                      </Tooltip>
                      {canManage && (
                        <>
                          <Tooltip label={t("Send by email", "ส่งทางอีเมล")}>
                            <SendEmailButton
                              variant="icon"
                              doc={{
                                kind: "invoice",
                                id: i.id,
                                label: i.number,
                                clientName: i.clientName,
                                clientEmail: i.clientEmail,
                                projectName: i.projectName,
                                amount: i.netPayable,
                                dueDate: i.dueDate,
                                sentAt: i.sentAt,
                                sentTo: i.sentTo,
                              }}
                            />
                          </Tooltip>
                          <Tooltip label={t("Edit", "แก้ไข")}>
                            <Link href={`/documents/invoices/${i.id}`} className={iconButton} aria-label={t("Edit", "แก้ไข")}>
                              <Pencil size={16} />
                            </Link>
                          </Tooltip>
                          {i.status === "paid" ? (
                            <Tooltip
                              label={t("Mark as unpaid", "เปลี่ยนเป็นยังไม่ชำระ")}
                              hint={t("If it was marked paid by mistake", "หากบันทึกว่าชำระแล้วโดยผิดพลาด")}
                            >
                              <button onClick={() => togglePaid(i)} disabled={pending} className={iconButton} aria-label={t("Mark as unpaid", "เปลี่ยนเป็นยังไม่ชำระ")}>
                                <RotateCcw size={16} />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label={t("Mark as paid", "บันทึกว่าชำระแล้ว")}>
                              <button
                                onClick={() => togglePaid(i)}
                                disabled={pending}
                                className={`${iconBase} hover:bg-green-50 hover:text-green-700`}
                                aria-label={t("Mark as paid", "บันทึกว่าชำระแล้ว")}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip label={t("Delete", "ลบ")}>
                            <button
                              onClick={() => remove(i)}
                              disabled={pending}
                              className={`${iconBase} hover:bg-red-50 hover:text-red-600`}
                              aria-label={t("Delete", "ลบ")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-gray-100 p-4">
        <Pagination page={s.page} pageSize={PAGE_SIZE} total={s.filtered.length} onChange={s.setPage} />
      </div>
    </div>
  )
}
