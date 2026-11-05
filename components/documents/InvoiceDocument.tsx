import { Letterhead } from "@/components/documents/Letterhead"
import {
  amountInThaiWords,
  amountInWords,
  COMPANY,
  formatMoney,
  formatNumber,
  formatThaiDate,
  invoiceTotals,
  type InvoiceItem,
} from "@/lib/documents"

export type InvoiceDoc = {
  number: string
  quotationLabel: string
  clientName: string
  clientAddress: string
  clientTaxId: string
  projectName: string
  date: Date
  dueDate: Date | null
  items: InvoiceItem[]
  vatPct: number
  withholdingPct: number
  note: string
  status: string
  paidAt: Date | null
}

// One portrait sheet in the same letterhead and table style as the quotation.
export default function InvoiceDocument({ inv }: { inv: InvoiceDoc }) {
  const totals = invoiceTotals(inv.items, inv.vatPct, inv.withholdingPct)
  const fillerRows = Math.max(0, 10 - inv.items.length)
  const paid = inv.status === "paid"

  return (
    <article className="sheet relative">
      <Letterhead />

      {paid && (
        <div className="pointer-events-none absolute right-[22mm] top-[48mm] rotate-[-12deg] rounded-lg border-4 border-green-600 px-4 py-1 text-center font-sans text-green-600 opacity-80">
          <p className="text-[26px] font-black tracking-widest">PAID</p>
          {inv.paidAt && <p className="text-[11px] font-bold">{formatThaiDate(inv.paidAt)}</p>}
        </div>
      )}

      <h1 className="text-center text-[26px] font-bold leading-none">INVOICE</h1>
      <p className="text-center text-[14px] font-bold">ใบแจ้งหนี้</p>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-4 text-[13px]">
        <div className="rounded-lg border border-black p-2 leading-snug">
          <p className="font-bold">Bill to / ลูกค้า</p>
          <p className="font-bold">{inv.clientName}</p>
          {inv.clientAddress && <p className="whitespace-pre-line">{inv.clientAddress}</p>}
          {inv.clientTaxId && <p>Tax ID : {inv.clientTaxId}</p>}
        </div>
        <table className="h-fit text-[13px] [&_td]:px-1 [&_td]:py-0.5">
          <tbody>
            <InfoRow label="No. / เลขที่" value={inv.number} bold />
            <InfoRow label="Date / วันที่" value={formatThaiDate(inv.date)} />
            {inv.dueDate && <InfoRow label="Due date / ครบกำหนด" value={formatThaiDate(inv.dueDate)} />}
            {inv.quotationLabel && <InfoRow label="Quotation / อ้างอิง" value={inv.quotationLabel} />}
            {inv.projectName && <InfoRow label="Project / โครงการ" value={inv.projectName} />}
          </tbody>
        </table>
      </div>

      <table className="doc-table mt-3 text-[11.5px]">
        <thead>
          <tr>
            <th className="w-8">No.</th>
            <th>Description</th>
            <th className="w-12">Qty</th>
            <th className="w-12">Unit</th>
            <th className="w-28">
              Unit
              <br />
              Price
            </th>
            <th className="w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => (
            <tr key={i} className="[&>td]:border-y-0">
              <td className="text-center">{i + 1}</td>
              <td className="whitespace-pre-line">{item.description}</td>
              <td className="num text-center">{formatNumber(item.qty)}</td>
              <td className="text-center">{item.unit}</td>
              <td className="num">{formatMoney(item.unitPrice)}</td>
              <td className="num">{formatMoney(item.qty * item.unitPrice)}</td>
            </tr>
          ))}
          {Array.from({ length: fillerRows }, (_, i) => (
            <tr key={`f${i}`} className="h-[18px] [&>td]:border-y-0">
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          ))}
          <TotalRow label="Sub total / รวมเป็นเงิน" amount={totals.subtotal} first />
          <TotalRow label={`Vat ${formatNumber(inv.vatPct)}% / ภาษีมูลค่าเพิ่ม`} amount={totals.vat} />
          <TotalRow label="Grand Total / ยอดรวม" amount={totals.total} bold />
          {inv.withholdingPct > 0 && (
            <>
              <TotalRow
                label={`Less withholding tax ${formatNumber(inv.withholdingPct)}% / หัก ณ ที่จ่าย`}
                amount={-totals.withholding}
              />
              <TotalRow label="Net Payable / ยอดชำระสุทธิ" amount={totals.netPayable} bold />
            </>
          )}
          <tr>
            <td colSpan={6} className="text-center italic">
              ({amountInWords(totals.netPayable)})
              <br />({amountInThaiWords(totals.netPayable)})
            </td>
          </tr>
        </tbody>
      </table>

      {inv.note && (
        <div className="mt-3 rounded-lg border border-black p-2 text-[12.5px]">
          <p className="font-bold">Remark / หมายเหตุ</p>
          <p className="whitespace-pre-line">{inv.note}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-8 text-center text-[13px]">
        <Signature caption="Received by / ผู้รับเอกสาร" />
        <Signature caption={`For ${COMPANY.nameEn}`} />
      </div>

      {COMPANY.taxId && <p className="mt-4 text-center text-[11px]">Tax ID : {COMPANY.taxId}</p>}
    </article>
  )
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="whitespace-nowrap font-bold">{label}</td>
      <td>:</td>
      <td className={bold ? "font-bold" : ""}>{value}</td>
    </tr>
  )
}

function TotalRow({ label, amount, bold, first }: { label: string; amount: number; bold?: boolean; first?: boolean }) {
  return (
    <tr className={bold ? "font-bold" : ""}>
      <td colSpan={4} className={`border-b-0 border-l-0 ${first ? "" : "border-t-0"}`} />
      <td className="whitespace-nowrap text-right">{label}</td>
      <td className="num">{amount < 0 ? `-${formatMoney(-amount)}` : formatMoney(amount)}</td>
    </tr>
  )
}

function Signature({ caption }: { caption: string }) {
  return (
    <div>
      <div className="mx-auto mt-10 w-3/4 border-t border-dotted border-black" />
      <p className="mt-1">{caption}</p>
      <p className="mt-2">Date ………/……………/………</p>
    </div>
  )
}
