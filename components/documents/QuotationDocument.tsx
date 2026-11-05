import { Fragment } from "react"
import { CompactLetterhead, Letterhead } from "@/components/documents/Letterhead"
import {
  amountInWords,
  conditionGroups,
  formatMoney,
  formatNumber,
  formatThaiDate,
  groupNumbers,
  isPriced,
  lineCosts,
  quotationLabel,
  quotationTotals,
  sectionLetter,
  type PaymentStage,
  type QuoteLine,
  type QuoteSection,
} from "@/lib/documents"

export type QuotationDoc = {
  number: string
  revision: number
  projectName: string
  clientName: string
  clientAddress: string
  subject: string
  date: Date
  validityDays: number
  overheadPct: number
  vatPct: number
  sections: QuoteSection[]
  paymentTerms: PaymentStage[]
  conditions: string
}

const money = (n: number) => (n ? formatMoney(n) : "-")

// Two sheets, laid out like the company's Excel quotation: a portrait summary
// (one line per section, totals, signatures, conditions) followed by the
// landscape detail / bill of quantities.
export default function QuotationDocument({ q }: { q: QuotationDoc }) {
  const label = quotationLabel(q.number, q.revision)
  const totals = quotationTotals(q.sections, q.overheadPct, q.vatPct)
  const conditions = conditionGroups(q.conditions, q.paymentTerms, label)
  const fillerRows = Math.max(0, 7 - q.sections.length)

  return (
    <>
      {/* ===== Summary sheet ===== */}
      <article className="sheet">
        <Letterhead />

        <h1 className="text-center text-[26px] font-bold leading-none">QUOTATION</h1>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 text-[14px] font-bold leading-snug">
          <p>Projectname : {q.projectName}</p>
          <p>Date : {formatThaiDate(q.date)}</p>
          <p>Client : {q.clientName}</p>
          <p>No. : {label}</p>
          <p className="col-span-2 whitespace-pre-line">Address : {q.clientAddress}</p>
          {q.subject && <p className="col-span-2">Subject : {q.subject}</p>}
        </div>

        <table className="doc-table mt-3 text-[11.5px]">
          <thead>
            <tr>
              <th className="w-8">No.</th>
              <th>Description</th>
              <th className="w-10">Qty</th>
              <th className="w-10">Unit</th>
              <th className="w-24">
                Mat
                <br />
                cost
              </th>
              <th className="w-24">
                Labour
                <br />
                cost
              </th>
              <th className="w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {q.sections.map((s, i) => (
              <tr key={i} className="[&>td]:border-y-0">
                <td className="text-center">{sectionLetter(i)}</td>
                <td>{s.title}</td>
                <td className="text-center">1</td>
                <td className="text-center">lot</td>
                <td className="num">{formatMoney(totals.perSection[i].mat)}</td>
                <td className="num">{formatMoney(totals.perSection[i].labour)}</td>
                <td className="num">{formatMoney(totals.perSection[i].amount)}</td>
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
                <td />
              </tr>
            ))}
            <tr className="[&>td]:border-t-0">
              <td />
              <td className="pb-2 pt-4">VALIDITY DAY {q.validityDays} DAYS</td>
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>

            <SummaryRow label="Sub total Cost" mat={totals.mat} labour={totals.labour} amount={totals.subtotal} />
            <SummaryRow
              label={`Overhead & Profit  ${formatNumber(q.overheadPct)} %`}
              mat={totals.overheadMat}
              labour={totals.overheadLabour}
              amount={totals.overhead}
            />
            <SummaryRow
              label="Total Cost"
              mat={totals.mat + totals.overheadMat}
              labour={totals.labour + totals.overheadLabour}
              amount={totals.totalCost}
            />
            <SummaryRow label={`Vat ${formatNumber(q.vatPct)}%`} amount={totals.vat} light />
            <SummaryRow label="Grand Total" amount={totals.grandTotal} />
            <tr>
              <td colSpan={7} className="text-center font-normal italic">
                ({amountInWords(totals.grandTotal)})
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="mt-4 grid grid-cols-2 gap-8 text-[13px]">
          <SignatureBox caption="Purchase Approved in Accordance With This Quotation" date="………/……………………/………………" />
          <SignatureBox caption="For Uto Advance Engineering" date={formatThaiDate(q.date)} />
        </div>

        {/* General conditions */}
        {conditions.length > 0 && (
          <div className="mt-4 pl-6 text-[13px] leading-snug">
            <p className="font-bold underline">General Conditions.</p>
            {conditions.map((g, gi) => (
              <div key={gi}>
                {g.title && (
                  <p className="font-bold">
                    <span className="inline-block w-6">{gi + 1}</span>
                    {g.title}
                  </p>
                )}
                {g.points.map((point, pi) => (
                  <p key={pi} className="pl-6">
                    {gi + 1}.{pi + 1} ) {point}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </article>

      {/* ===== Detail / bill of quantities ===== */}
      <article className="sheet sheet-landscape">
        <CompactLetterhead />
        <table className="doc-table">
          <thead>
            <tr>
              <th className="w-8">No.</th>
              <th>Description</th>
              <th className="w-12">Qty</th>
              <th className="w-10">Unit</th>
              <th className="w-[70px]">
                Mat
                <br />
                U.cost
              </th>
              <th className="w-[84px]">
                Mat
                <br />
                cost
              </th>
              <th className="w-[70px]">
                Labour
                <br />
                U.cost
              </th>
              <th className="w-[84px]">
                Labour
                <br />
                cost
              </th>
              <th className="w-[96px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td />
              <td colSpan={8} className="font-bold">
                {q.subject ? `${q.subject.toUpperCase()} ` : ""}
                {label}
              </td>
            </tr>
            {q.sections.map((s, si) => {
              const numbers = groupNumbers(s.lines)
              const st = totals.perSection[si]
              return (
                <Fragment key={si}>
                  <tr className="text-[12px] font-bold">
                    <td className="text-center">{sectionLetter(si)}</td>
                    <td className="underline" colSpan={4}>
                      {s.title}
                    </td>
                    <td className="num">{formatMoney(st.mat)}</td>
                    <td />
                    <td className="num">{formatMoney(st.labour)}</td>
                    <td className="num">{formatMoney(st.amount)}</td>
                  </tr>
                  {s.lines.map((line, li) => (
                    <DetailLine key={li} line={line} number={numbers[li]} />
                  ))}
                  <tr className="h-[14px]">
                    <td colSpan={9} className="border-x-0" />
                  </tr>
                </Fragment>
              )
            })}
            <tr className="text-[12px] font-bold">
              <td />
              <td colSpan={4} className="text-right">
                TOTAL ({q.sections.map((_, i) => sectionLetter(i)).join(" + ")})
              </td>
              <td className="num">{formatMoney(totals.mat)}</td>
              <td />
              <td className="num">{formatMoney(totals.labour)}</td>
              <td className="num">{formatMoney(totals.subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </>
  )
}

function SummaryRow({
  label,
  mat,
  labour,
  amount,
  light,
}: {
  label: string
  mat?: number
  labour?: number
  amount: number
  light?: boolean
}) {
  return (
    <tr className={light ? "font-normal" : ""}>
      <td />
      <td colSpan={3} className="text-center">
        {label}
      </td>
      <td className="num">{mat !== undefined ? formatMoney(mat) : ""}</td>
      <td className="num">{labour !== undefined ? formatMoney(labour) : ""}</td>
      <td className="num">{formatMoney(amount)}</td>
    </tr>
  )
}

function SignatureBox({ caption, date }: { caption: string; date: string }) {
  return (
    <div className="text-center">
      <p className="whitespace-nowrap">{caption}</p>
      <div className="mt-1 flex h-[70px] flex-col justify-end rounded-xl border border-gray-400 px-4 pb-1">
        <div className="border-t border-[#1e3a5f]" />
        <p className="mt-1 font-sans text-[13px]">Authorized By</p>
      </div>
      <p className="mt-2">Date : {date}</p>
    </div>
  )
}

function DetailLine({ line, number }: { line: QuoteLine; number: number | null }) {
  if (line.kind === "group" && !isPriced(line)) {
    return (
      <tr className="font-bold">
        <td className="text-center">{number}</td>
        <td colSpan={8} className="whitespace-pre-line">
          {line.description}
        </td>
      </tr>
    )
  }
  if (line.kind === "heading") {
    return (
      <tr>
        <td />
        <td colSpan={8} className="whitespace-pre-line">
          {line.description}
        </td>
      </tr>
    )
  }

  const c = lineCosts(line)
  const showNote = line.note && !line.matUnit
  const group = line.kind === "group"
  return (
    <tr className={group ? "font-bold [&>td:not(:nth-child(2))]:font-normal" : ""}>
      <td className="text-center">{group ? number : ""}</td>
      <td className={`whitespace-pre-line ${group ? "" : "pl-4"}`}>{group ? line.description : `.- ${line.description}`}</td>
      <td className="num text-center">{line.qty ? formatNumber(line.qty) : ""}</td>
      <td className="text-center">{line.unit}</td>
      {showNote ? (
        <td colSpan={2} className="font-bold">
          {line.note}
        </td>
      ) : (
        <>
          <td className="num">{money(line.matUnit)}</td>
          <td className="num">{money(c.mat)}</td>
        </>
      )}
      <td className="num">{line.labourUnit ? formatMoney(line.labourUnit) : ""}</td>
      <td className="num">{money(c.labour)}</td>
      <td className="num">{money(c.amount)}</td>
    </tr>
  )
}
