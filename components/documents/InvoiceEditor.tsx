"use client"

import { useEffect, useState, useTransition } from "react"
import NumberInput from "@/components/documents/NumberInput"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ArrowLeft, Check, Eye, Plus, Save, X } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"
import Tooltip from "@/components/Tooltip"
import type { ClientOption } from "@/lib/documents-server"
import {
  amountInThaiWords,
  amountInWords,
  emptyInvoiceItem,
  formatMoney,
  formatNumber,
  INVOICE_STATUSES,
  invoiceTotals,
  stageItem,
  UNITS,
  type InvoiceItem,
  type QuotationSource,
} from "@/lib/documents"
import { saveInvoice, type InvoiceInput } from "@/app/documents/actions"
import { invoiceStatusLabel } from "@/components/documents/DocumentLists"

export default function InvoiceEditor({
  id,
  initial,
  source,
  clients,
}: {
  id: number | null
  initial: InvoiceInput
  source: QuotationSource | null
  clients: ClientOption[]
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(initial)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = (patch: Partial<InvoiceInput>) => {
    setDirty(true)
    setForm((f) => ({ ...f, ...patch }))
  }
  const setItems = (fn: (items: InvoiceItem[]) => InvoiceItem[]) => update({ items: fn(form.items) })
  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setItems((all) => all.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const pickStage = (stage: { label: string; percent: number }) => {
    if (!source) return
    update({ stageLabel: `${stage.label} ${formatNumber(stage.percent)}%`, items: [stageItem(source, stage)] })
  }

  const pickClient = (clientId: string) => {
    const c = clients.find((x) => String(x.id) === clientId)
    if (c) update({ clientName: c.name, clientEmail: c.email, clientAddress: c.address ?? "", projectName: c.projectName || form.projectName })
  }

  const totals = invoiceTotals(form.items, form.vatPct, form.withholdingPct)

  const save = (thenView: boolean) =>
    startTransition(async () => {
      const result = await saveInvoice(id, form)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setDirty(false)
      toast.success(t("Invoice saved", "บันทึกใบแจ้งหนี้แล้ว"))
      if (thenView) router.push(`/documents/invoices/${result.id}/print`)
      else if (id === null) router.replace(`/documents/invoices/${result.id}`)
      else router.refresh()
    })

  return (
    <div className="page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/documents?tab=invoices" className="back-link">
            <ArrowLeft size={16} /> {t("Quotations & Invoices", "ใบเสนอราคาและใบแจ้งหนี้")}
          </Link>
          <h1 className="page-title mt-2">
            {id === null ? t("New invoice", "สร้างใบแจ้งหนี้") : t(`Edit ${initial.number}`, `แก้ไข ${initial.number}`)}
          </h1>
          {source && (
            <p className="page-subtitle">
              {t(`From quotation ${source.label}`, `จากใบเสนอราคา ${source.label}`)} · {source.projectName}
            </p>
          )}
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

      {/* Which payment stage to bill */}
      {source && source.stages.length > 0 && (
        <section className="card space-y-3 p-6">
          <div>
            <h2 className="section-title">{t("Bill a payment stage", "เลือกงวดที่จะเรียกเก็บ")}</h2>
            <p className="text-xs text-gray-500">
              {t(
                `Worked out from the quotation's total before VAT: ฿${formatMoney(source.totalCost)}.`,
                `คำนวณจากยอดรวมก่อนภาษีของใบเสนอราคา: ฿${formatMoney(source.totalCost)}`
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {source.stages.map((stage) => {
              const label = `${stage.label} ${formatNumber(stage.percent)}%`
              const active = form.stageLabel === label
              return (
                <button
                  key={label}
                  onClick={() => pickStage(stage)}
                  className={`rounded-2xl border px-4 py-2 text-left text-sm transition ${
                    active ? "border-sky-600 bg-sky-50 ring-2 ring-sky-500" : "border-gray-200 hover:border-sky-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                    {label}
                    {stage.invoiced && (
                      <span className="badge bg-green-100 text-green-700">
                        <Check size={12} /> {t("Invoiced", "ออกแล้ว")}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">฿{formatMoney((source.totalCost * stage.percent) / 100)}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{t("Details", "รายละเอียด")}</h2>
          {!source && clients.length > 0 && (
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
          <div>
            <label className="label">{t("Invoice no.", "เลขที่ใบแจ้งหนี้")} *</label>
            <input value={form.number} onChange={(e) => update({ number: e.target.value })} className="input font-mono" />
          </div>
          <div>
            <label className="label">{t("Date", "วันที่")} *</label>
            <input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("Due date", "วันครบกำหนด")}</label>
            <input type="date" value={form.dueDate} onChange={(e) => update({ dueDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("Status", "สถานะ")}</label>
            <select value={form.status} onChange={(e) => update({ status: e.target.value as InvoiceInput["status"] })} className="input">
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {invoiceStatusLabel(s, t)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">{t("Bill to", "เรียกเก็บจาก")} *</label>
            <input value={form.clientName} onChange={(e) => update({ clientName: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">{t("Client tax ID", "เลขประจำตัวผู้เสียภาษีลูกค้า")}</label>
            <input value={form.clientTaxId} onChange={(e) => update({ clientTaxId: e.target.value })} placeholder={t("if a company", "ถ้าเป็นนิติบุคคล")} className="input" />
          </div>
          <div>
            <label className="label">{t("Project", "โครงการ")}</label>
            <input value={form.projectName} onChange={(e) => update({ projectName: e.target.value })} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t("Client email", "อีเมลลูกค้า")}</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => update({ clientEmail: e.target.value })}
              placeholder={t("for sending", "สำหรับส่งเอกสาร")}
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t("Address", "ที่อยู่")}</label>
            <textarea rows={2} value={form.clientAddress} onChange={(e) => update({ clientAddress: e.target.value })} className="input" />
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="card overflow-hidden">
        <datalist id="invoice-units">
          {UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="w-10 p-3">No.</th>
                <th className="p-3 text-left">{t("Description", "รายการ")}</th>
                <th className="w-24 p-3 text-right">{t("Qty", "จำนวน")}</th>
                <th className="w-24 p-3 text-left">{t("Unit", "หน่วย")}</th>
                <th className="w-36 p-3 text-right">{t("Unit price", "ราคาต่อหน่วย")}</th>
                <th className="w-32 p-3 text-right">{t("Amount", "จำนวนเงิน")}</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, i) => (
                <tr key={i} className="border-t border-gray-100 align-top">
                  <td className="p-2 pt-4 text-center text-gray-500">{i + 1}</td>
                  <td className="p-2">
                    <textarea
                      rows={Math.max(1, item.description.split("\n").length)}
                      value={item.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      className="input resize-y px-2 py-1"
                    />
                  </td>
                  <td className="p-2">
                    <NumberInput value={item.qty} onChange={(n) => setItem(i, { qty: n })} />
                  </td>
                  <td className="p-2">
                    <input list="invoice-units" value={item.unit} onChange={(e) => setItem(i, { unit: e.target.value })} className="input px-2 py-1" />
                  </td>
                  <td className="p-2">
                    <NumberInput value={item.unitPrice} onChange={(n) => setItem(i, { unitPrice: n })} />
                  </td>
                  <td className="whitespace-nowrap p-2 pt-4 text-right font-medium">{formatMoney(item.qty * item.unitPrice)}</td>
                  <td className="p-2 pt-3">
                    <Tooltip label={t("Remove", "ลบ")}>
                      <button onClick={() => setItems((all) => all.filter((_, j) => j !== i))} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={t("Remove", "ลบ")}>
                        <X size={16} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 p-3">
          <button onClick={() => setItems((all) => [...all, emptyInvoiceItem()])} className="btn-ghost">
            <Plus size={16} /> {t("Add item", "เพิ่มรายการ")}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t("VAT %", "ภาษีมูลค่าเพิ่ม %")}</label>
              <NumberInput value={form.vatPct} onChange={(n) => update({ vatPct: n })} className="text-left" />
            </div>
            <div>
              <label className="label">{t("Withholding tax %", "หัก ณ ที่จ่าย %")}</label>
              <select value={form.withholdingPct} onChange={(e) => update({ withholdingPct: Number(e.target.value) })} className="input">
                {[0, 1, 2, 3, 5].map((p) => (
                  <option key={p} value={p}>
                    {p === 0 ? t("None", "ไม่มี") : `${p}%`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {t(
              "Withholding tax: when a company client pays for services, they usually keep 3% of the amount before VAT and send it to the Revenue Department for you.",
              "ภาษีหัก ณ ที่จ่าย: ลูกค้านิติบุคคลที่จ่ายค่าบริการมักหัก 3% ของยอดก่อนภาษีมูลค่าเพิ่ม แล้วนำส่งกรมสรรพากรแทน"
            )}
          </p>
          <div>
            <label className="label">{t("Note / payment details", "หมายเหตุ / ช่องทางชำระเงิน")}</label>
            <textarea
              rows={4}
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder={"Please transfer to\nBank: …\nAccount name: UTO Advance Engineering Co.,Ltd.\nAccount no.: …"}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("New invoices start with the note from your last invoice.", "ใบแจ้งหนี้ใหม่จะใช้หมายเหตุจากใบล่าสุดโดยอัตโนมัติ")}
            </p>
          </div>
        </section>

        <section className="card h-fit space-y-3 p-6">
          <h2 className="section-title">{t("Summary", "สรุปยอด")}</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt>{t("Subtotal", "รวมเป็นเงิน")}</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t(`VAT ${formatNumber(form.vatPct)}%`, `ภาษีมูลค่าเพิ่ม ${formatNumber(form.vatPct)}%`)}</dt>
              <dd>{formatMoney(totals.vat)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{t("Total", "ยอดรวม")}</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
            {form.withholdingPct > 0 && (
              <div className="flex justify-between text-gray-600">
                <dt>{t(`Less withholding tax ${form.withholdingPct}%`, `หัก ณ ที่จ่าย ${form.withholdingPct}%`)}</dt>
                <dd>-{formatMoney(totals.withholding)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <dt>{t("Amount due", "ยอดที่ต้องชำระ")}</dt>
              <dd>฿{formatMoney(totals.netPayable)}</dd>
            </div>
          </dl>
          <p className="text-xs italic text-gray-500">
            ({amountInWords(totals.netPayable)})
            <br />({amountInThaiWords(totals.netPayable)})
          </p>
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
