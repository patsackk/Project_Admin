// Quotations & invoices: shapes, totals and formatting. Shared by the editors
// (client) and the printable documents (server), so a number on screen is
// always worked out the same way as the number on paper.

export const COMPANY = {
  nameEn: "UTO ADVANCE ENGINEERING CO.,LTD.",
  nameTh: "ยูทู แอดวานซ์ เอ็นจิเนียริ่ง",
  addressLines: ["123/112 Thepkrasattri Rd.", "A.Muang Phuket 83000"],
  phone: "0987647897, 0658501248",
  email: "Utoadvance@gmail.com",
  // Printed on invoices when set. A Thai tax invoice needs the seller's
  // 13-digit tax ID.
  taxId: "",
}

// ---------- Quotation ----------

// "group" = numbered line (1 REFRIGERANT PIPE); it can carry a price too, as
// in "4 Drain pipe PVC.class 8.5 · 1 Lot". "heading" = unnumbered sub-heading
// (Copper tube type L), never priced. "item" = a priced line.
export type QuoteLineKind = "group" | "heading" | "item"

export type QuoteLine = {
  kind: QuoteLineKind
  description: string
  qty: number
  unit: string
  matUnit: number
  labourUnit: number
  // Shown instead of the material price, e.g. "Included", "By Owner",
  // "Existing system", "Not included".
  note: string
}

export type QuoteSection = { title: string; lines: QuoteLine[] }

export type PaymentStage = { label: string; percent: number }

export const QUOTATION_STATUSES = ["draft", "sent", "approved", "rejected"] as const
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export const INVOICE_STATUSES = ["unpaid", "paid"] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const UNITS = ["Set", "Lot", "M", "Sq.ft", "Sq.m", "Pcs", "Unit", "Job", "cu.m", "L"]

export const DEFAULT_PAYMENT_TERMS: PaymentStage[] = [
  { label: "Deposit", percent: 30 },
  { label: "Progress work", percent: 60 },
  { label: "Complete work", percent: 10 },
]

export const DEFAULT_CONDITIONS = `Construction term
- Construction period as discussed
- The price is not a fixed rate of material
Scope of works
- Supply and install as {number}
Not included in scope of works
- Electrical and water fee by Owner
Warranty
- 1 year general equipment warranty under normal operating conditions
- The company does not guarantee equipment other than in the quotation in any case`

export const emptyLine = (kind: QuoteLineKind = "item"): QuoteLine => ({
  kind,
  description: "",
  qty: kind === "item" ? 1 : 0,
  unit: kind === "item" ? "Set" : "",
  matUnit: 0,
  labourUnit: 0,
  note: "",
})

export const sectionLetter = (index: number) => String.fromCharCode(65 + index) // A, B, C…

export function lineCosts(line: QuoteLine) {
  if (line.kind === "heading") return { mat: 0, labour: 0, amount: 0 }
  const mat = line.qty * line.matUnit
  const labour = line.qty * line.labourUnit
  return { mat, labour, amount: mat + labour }
}

// A numbered group with no quantity, price or note is just a heading.
export const isPriced = (line: QuoteLine) =>
  line.kind === "item" || (line.kind === "group" && !!(line.qty || line.matUnit || line.labourUnit || line.note))

export function sectionTotals(section: QuoteSection) {
  let mat = 0
  let labour = 0
  for (const line of section.lines) {
    const c = lineCosts(line)
    mat += c.mat
    labour += c.labour
  }
  return { mat, labour, amount: mat + labour }
}

// Overhead & profit goes on top of the cost, then VAT on top of that —
// the same order as the summary page of the paper quotation.
export function quotationTotals(sections: QuoteSection[], overheadPct: number, vatPct: number) {
  const perSection = sections.map(sectionTotals)
  const mat = perSection.reduce((s, x) => s + x.mat, 0)
  const labour = perSection.reduce((s, x) => s + x.labour, 0)
  const subtotal = mat + labour
  const overheadMat = (mat * overheadPct) / 100
  const overheadLabour = (labour * overheadPct) / 100
  const overhead = overheadMat + overheadLabour
  const totalCost = subtotal + overhead
  const vat = (totalCost * vatPct) / 100
  return {
    perSection,
    mat,
    labour,
    subtotal,
    overheadMat,
    overheadLabour,
    overhead,
    totalCost,
    vat,
    grandTotal: totalCost + vat,
  }
}

// Numbers each group within its section: 1, 2, 3… (headings and items aren't
// numbered).
export function groupNumbers(lines: QuoteLine[]) {
  let n = 0
  return lines.map((l) => (l.kind === "group" ? ++n : null))
}

export const quotationLabel = (number: string, revision: number) =>
  revision > 0 ? `${number} R${revision}` : number

// Conditions text → numbered groups. A line without a leading "-" starts a
// heading; "- ..." lines are its points. The payment stages are slotted in
// as the second heading, as on the paper quotation.
export function conditionGroups(text: string, payment: PaymentStage[], quotationRef: string) {
  const groups: { title: string; points: string[] }[] = []
  for (const raw of text.split("\n")) {
    const line = raw.trim().replaceAll("{number}", quotationRef)
    if (!line) continue
    if (line.startsWith("-")) {
      const point = line.replace(/^-+\s*/, "")
      if (groups.length === 0) groups.push({ title: "", points: [] })
      groups[groups.length - 1].points.push(point)
    } else {
      groups.push({ title: line, points: [] })
    }
  }
  if (payment.length > 0) {
    const paymentGroup = {
      title: "Term of payment",
      points: payment.map((p) => `${p.label} ${formatNumber(p.percent)} %`),
    }
    groups.splice(Math.min(1, groups.length), 0, paymentGroup)
  }
  return groups
}

// ---------- Invoice ----------

export type InvoiceItem = { description: string; qty: number; unit: string; unitPrice: number }

export const emptyInvoiceItem = (): InvoiceItem => ({ description: "", qty: 1, unit: "Lot", unitPrice: 0 })

export function invoiceTotals(items: InvoiceItem[], vatPct: number, withholdingPct: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const vat = (subtotal * vatPct) / 100
  const total = subtotal + vat
  // Withholding tax is worked out on the amount before VAT.
  const withholding = (subtotal * withholdingPct) / 100
  return { subtotal, vat, total, withholding, netPayable: total - withholding }
}

export type QuotationSource = {
  id: number
  label: string
  subject: string
  projectName: string
  clientName: string
  clientEmail: string
  clientAddress: string
  totalCost: number // before VAT
  vatPct: number
  stages: { label: string; percent: number; invoiced: boolean }[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

// The invoice line for one payment stage of a quotation, e.g.
// "Deposit 30% of Plumbing and Aircondition work (Quotation Q-DC-UTO-002-26 R3)".
export function stageItem(source: QuotationSource, stage: { label: string; percent: number }): InvoiceItem {
  return {
    description: `${stage.label} ${formatNumber(stage.percent)}% of ${source.subject || source.projectName}\n(Quotation ${source.label}, total ${formatMoney(source.totalCost)} before VAT)`,
    qty: 1,
    unit: "Lot",
    unitPrice: round2((source.totalCost * stage.percent) / 100),
  }
}

// ---------- Cleaning input from the editors ----------

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "")

export function cleanSections(input: unknown): QuoteSection[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 26).map((s) => ({
    title: str(s?.title, 200),
    lines: (Array.isArray(s?.lines) ? s.lines : []).slice(0, 500).map((l: Record<string, unknown>) => ({
      kind: (["group", "heading", "item"] as const).includes(l?.kind as QuoteLineKind)
        ? (l.kind as QuoteLineKind)
        : "item",
      description: str(l?.description),
      qty: num(l?.qty),
      unit: str(l?.unit, 20),
      matUnit: num(l?.matUnit),
      labourUnit: num(l?.labourUnit),
      note: str(l?.note, 100),
    })),
  }))
}

export function cleanPaymentTerms(input: unknown): PaymentStage[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, 10)
    .map((p) => ({ label: str(p?.label, 100).trim(), percent: num(p?.percent) }))
    .filter((p) => p.label)
}

export function cleanInvoiceItems(input: unknown): InvoiceItem[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, 200)
    .map((i) => ({
      description: str(i?.description).trim(),
      qty: num(i?.qty),
      unit: str(i?.unit, 20),
      unitPrice: num(i?.unitPrice),
    }))
    .filter((i) => i.description)
}

// ---------- Formatting ----------

export function formatMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

// Documents use the Thai Buddhist year, e.g. 20/8/2569.
export function formatThaiDate(date: Date | string) {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

// yyyy-mm-dd for <input type="date">, in local time.
export function toDateInput(date: Date | string) {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
]
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

function below1000(n: number) {
  const words: string[] = []
  if (n >= 100) {
    words.push(`${ONES[Math.floor(n / 100)]} Hundred`)
    n %= 100
  }
  if (n >= 20) {
    words.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""))
  } else if (n > 0) {
    words.push(ONES[n])
  }
  return words.join(" ")
}

function integerWords(n: number) {
  if (n === 0) return "Zero"
  const scales = ["", "Thousand", "Million", "Billion"]
  const parts: string[] = []
  let i = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk) parts.unshift(below1000(chunk) + (scales[i] ? ` ${scales[i]}` : ""))
    n = Math.floor(n / 1000)
    i++
  }
  return parts.join(" ")
}

// 2,662,924.13 → "Two Million Six Hundred Sixty-Two Thousand Nine Hundred
// Twenty-Four Baht and Thirteen Satang"
export function amountInWords(amount: number) {
  const satangTotal = Math.round(Math.abs(amount) * 100)
  const baht = Math.floor(satangTotal / 100)
  const satang = satangTotal % 100
  const words = `${integerWords(baht)} Baht`
  return satang ? `${words} and ${integerWords(satang)} Satang` : `${words} Only`
}

const THAI_DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"]
const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"]

// afterMillion: the 1 in 1,000,001 is read "เอ็ด" too.
function thaiBelowMillion(n: number, afterMillion = false) {
  const digits = String(n).split("").map(Number)
  let out = ""
  digits.forEach((d, i) => {
    const place = digits.length - 1 - i
    if (d === 0) return
    if (place === 1 && d === 1) out += "สิบ"
    else if (place === 1 && d === 2) out += "ยี่สิบ"
    else if (place === 0 && d === 1 && (digits.length > 1 || afterMillion)) out += "เอ็ด"
    else out += THAI_DIGITS[d] + THAI_PLACES[place]
  })
  return out
}

function thaiInteger(n: number): string {
  if (n === 0) return "ศูนย์"
  if (n < 1_000_000) return thaiBelowMillion(n)
  const high = Math.floor(n / 1_000_000)
  const low = n % 1_000_000
  return `${thaiInteger(high)}ล้าน${low ? thaiBelowMillion(low, true) : ""}`
}

// 2,662,924.13 → "สองล้านหกแสนหกหมื่นสองพันเก้าร้อยยี่สิบสี่บาทสิบสามสตางค์"
export function amountInThaiWords(amount: number) {
  const satangTotal = Math.round(Math.abs(amount) * 100)
  const baht = Math.floor(satangTotal / 100)
  const satang = satangTotal % 100
  return `${thaiInteger(baht)}บาท${satang ? `${thaiInteger(satang)}สตางค์` : "ถ้วน"}`
}

// ---------- Numbering ----------

// "DC HOUSE" → "DC", "Villa Mandarin" → "VM": a short first word as is,
// otherwise the initials.
export function projectCode(projectName: string) {
  const words = projectName.toUpperCase().match(/[A-Z0-9]+/g) ?? []
  const [first] = words
  if (!first) return "XX"
  if (first.length <= 4) return first
  return words.map((w) => w[0]).join("").slice(0, 4)
}

// Q-DC-UTO-002-26: project code, running number for the year, 2-digit year.
export function quotationNumber(projectName: string, seq: number, year: number) {
  return `Q-${projectCode(projectName)}-UTO-${String(seq).padStart(3, "0")}-${String(year).slice(-2)}`
}

// ---------- Email ----------

export type DocKind = "quotation" | "invoice"

// Pre-filled subject and message for the "Send by email" box. Clients are
// often foreign, so the email is in English.
export function emailDefaults(
  kind: DocKind,
  doc: { label: string; clientName: string; projectName: string; subject?: string; amount: number; dueDate?: string | null }
) {
  const sign = `Best regards,\n${COMPANY.nameEn}\nTel: ${COMPANY.phone}`
  if (kind === "quotation") {
    const what = doc.subject ? `${doc.subject} (${doc.projectName})` : doc.projectName
    return {
      subject: `Quotation ${doc.label} – ${doc.subject || doc.projectName}`,
      message: `Dear ${doc.clientName},\n\nThank you for your interest. Please find our quotation ${doc.label} for ${what}.\nThe grand total is ฿${formatMoney(doc.amount)} including VAT.\n\nIf you have any questions, just reply to this email.\n\n${sign}`,
    }
  }
  const due = doc.dueDate ? `, due on ${formatThaiDate(doc.dueDate)}` : ""
  return {
    subject: `Invoice ${doc.label}${doc.projectName ? ` – ${doc.projectName}` : ""}`,
    message: `Dear ${doc.clientName},\n\nPlease find invoice ${doc.label}${doc.projectName ? ` for ${doc.projectName}` : ""}.\nThe amount due is ฿${formatMoney(doc.amount)}${due}.\n\nThank you for your business.\n\n${sign}`,
  }
}
