"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { mailConfigured, sendMail, type MailAttachment } from "@/lib/mail"
import { documentEmailHtml } from "@/lib/document-email"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"
import {
  cleanInvoiceItems,
  formatMoney,
  formatThaiDate,
  invoiceTotals,
  quotationLabel,
  quotationTotals,
  type DocKind,
  type InvoiceItem as Item,
  cleanPaymentTerms,
  cleanSections,
  INVOICE_STATUSES,
  QUOTATION_STATUSES,
  type InvoiceItem,
  type InvoiceStatus,
  type PaymentStage,
  type QuotationStatus,
  type QuoteSection,
} from "@/lib/documents"

export type DocResult = { success: true; id: number } | { success: false; error: string }
type SimpleResult = { success: true } | { success: false; error: string }

export type QuotationInput = {
  number: string
  revision: number
  projectId: number | null
  projectName: string
  clientName: string
  clientEmail: string
  clientAddress: string
  subject: string
  date: string // yyyy-mm-dd
  validityDays: number
  overheadPct: number
  vatPct: number
  sections: QuoteSection[]
  paymentTerms: PaymentStage[]
  conditions: string
  status: QuotationStatus
}

export type InvoiceInput = {
  number: string
  quotationId: number | null
  stageLabel: string
  clientName: string
  clientEmail: string
  clientAddress: string
  clientTaxId: string
  projectName: string
  date: string
  dueDate: string // "" = none
  items: InvoiceItem[]
  vatPct: number
  withholdingPct: number
  note: string
  status: InvoiceStatus
}

async function guard() {
  const t = await getT()
  const allowed = await hasAccess("manageDocuments")
  const denied = {
    success: false as const,
    error: t(
      "You don't have permission to change quotations or invoices.",
      "คุณไม่มีสิทธิ์แก้ไขใบเสนอราคาหรือใบแจ้งหนี้"
    ),
  }
  const failed = {
    success: false as const,
    error: t("Something went wrong. Please try again.", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"),
  }
  return { t, allowed, denied, failed }
}

const isDuplicate = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"

// "2026-08-20" → that day at noon local time, so it never slips a day when
// shown in another timezone.
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)

function revalidate() {
  revalidatePath("/documents", "layout")
}

// ---------- Quotations ----------

export async function saveQuotation(id: number | null, input: QuotationInput): Promise<DocResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  const number = input.number.trim()
  const date = parseDate(input.date)
  if (!number || !input.projectName.trim() || !input.clientName.trim() || !date) {
    return {
      success: false,
      error: t(
        "Quotation number, project, client and date are required.",
        "กรุณากรอกเลขที่ใบเสนอราคา โครงการ ลูกค้า และวันที่"
      ),
    }
  }

  const data = {
    number,
    revision: Math.max(0, Math.round(finite(input.revision))),
    projectId: input.projectId || null,
    projectName: input.projectName.trim(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim(),
    clientAddress: input.clientAddress.trim(),
    subject: input.subject.trim(),
    date,
    validityDays: Math.max(0, Math.round(finite(input.validityDays, 30))),
    overheadPct: finite(input.overheadPct),
    vatPct: finite(input.vatPct),
    sections: cleanSections(input.sections) as Prisma.InputJsonValue,
    paymentTerms: cleanPaymentTerms(input.paymentTerms) as Prisma.InputJsonValue,
    conditions: input.conditions.slice(0, 5000),
    status: QUOTATION_STATUSES.includes(input.status) ? input.status : "draft",
  }

  try {
    const saved = id
      ? await prisma.quotation.update({ where: { id }, data })
      : await prisma.quotation.create({ data })
    revalidate()
    return { success: true, id: saved.id }
  } catch (error) {
    if (isDuplicate(error)) {
      return {
        success: false,
        error: t(
          "A quotation with this number and revision already exists.",
          "มีใบเสนอราคาเลขที่และรีวิชันนี้อยู่แล้ว"
        ),
      }
    }
    console.error("Save Quotation Error:", error)
    return failed
  }
}

// A revision keeps the number and bumps "R": R0 → R1. The old revision stays
// as it was, so what the client was sent is never lost.
export async function reviseQuotation(id: number): Promise<DocResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    const source = await prisma.quotation.findUnique({ where: { id } })
    if (!source) return failed
    const latest = await prisma.quotation.aggregate({
      where: { number: source.number },
      _max: { revision: true },
    })
    const copy = await prisma.quotation.create({
      data: {
        ...copyFields(source),
        revision: (latest._max.revision ?? source.revision) + 1,
        date: new Date(),
        status: "draft",
      },
    })
    revalidate()
    return { success: true, id: copy.id }
  } catch (error) {
    console.error("Revise Quotation Error:", error)
    return failed
  }
}

// A duplicate is a new quotation (new number) that starts from this one's
// lines — handy for a similar job.
export async function duplicateQuotation(id: number, number: string): Promise<DocResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    const source = await prisma.quotation.findUnique({ where: { id } })
    if (!source) return failed
    const copy = await prisma.quotation.create({
      data: { ...copyFields(source), number: number.trim(), revision: 0, date: new Date(), status: "draft" },
    })
    revalidate()
    return { success: true, id: copy.id }
  } catch (error) {
    if (isDuplicate(error)) {
      return { success: false, error: t("That quotation number is already used.", "เลขที่ใบเสนอราคานี้ถูกใช้แล้ว") }
    }
    console.error("Duplicate Quotation Error:", error)
    return failed
  }
}

function copyFields(q: Prisma.QuotationGetPayload<object>) {
  return {
    number: q.number,
    projectId: q.projectId,
    projectName: q.projectName,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientAddress: q.clientAddress,
    subject: q.subject,
    validityDays: q.validityDays,
    overheadPct: q.overheadPct,
    vatPct: q.vatPct,
    sections: q.sections as Prisma.InputJsonValue,
    paymentTerms: q.paymentTerms as Prisma.InputJsonValue,
    conditions: q.conditions,
  }
}

export async function setQuotationStatus(id: number, status: QuotationStatus): Promise<SimpleResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied
  if (!QUOTATION_STATUSES.includes(status)) return failed

  try {
    await prisma.quotation.update({ where: { id }, data: { status } })
  } catch (error) {
    console.error("Set Quotation Status Error:", error)
    return failed
  }
  revalidate()
  return { success: true }
}

// Invoices made from it are kept; they just lose the link.
export async function deleteQuotation(id: number): Promise<SimpleResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    await prisma.quotation.delete({ where: { id } })
  } catch (error) {
    console.error("Delete Quotation Error:", error)
    return failed
  }
  revalidate()
  return { success: true }
}

// ---------- Invoices ----------

export async function saveInvoice(id: number | null, input: InvoiceInput): Promise<DocResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  const number = input.number.trim()
  const date = parseDate(input.date)
  const items = cleanInvoiceItems(input.items)
  if (!number || !input.clientName.trim() || !date) {
    return {
      success: false,
      error: t("Invoice number, client and date are required.", "กรุณากรอกเลขที่ใบแจ้งหนี้ ลูกค้า และวันที่"),
    }
  }
  if (items.length === 0) {
    return { success: false, error: t("Add at least one item.", "กรุณาเพิ่มรายการอย่างน้อยหนึ่งรายการ") }
  }

  const status = INVOICE_STATUSES.includes(input.status) ? input.status : "unpaid"
  const data = {
    number,
    quotationId: input.quotationId || null,
    stageLabel: input.stageLabel.trim(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim(),
    clientAddress: input.clientAddress.trim(),
    clientTaxId: input.clientTaxId.trim(),
    projectName: input.projectName.trim(),
    date,
    dueDate: input.dueDate ? parseDate(input.dueDate) : null,
    items: items as Prisma.InputJsonValue,
    vatPct: finite(input.vatPct),
    withholdingPct: finite(input.withholdingPct),
    note: input.note.slice(0, 2000),
    status,
  }

  try {
    let saved
    if (id) {
      const before = await prisma.invoice.findUnique({ where: { id }, select: { paidAt: true } })
      saved = await prisma.invoice.update({
        where: { id },
        data: { ...data, paidAt: status === "paid" ? (before?.paidAt ?? new Date()) : null },
      })
    } else {
      saved = await prisma.invoice.create({
        data: { ...data, paidAt: status === "paid" ? new Date() : null },
      })
    }
    revalidate()
    return { success: true, id: saved.id }
  } catch (error) {
    if (isDuplicate(error)) {
      return { success: false, error: t("That invoice number is already used.", "เลขที่ใบแจ้งหนี้นี้ถูกใช้แล้ว") }
    }
    console.error("Save Invoice Error:", error)
    return failed
  }
}

export async function setInvoiceStatus(id: number, status: InvoiceStatus): Promise<SimpleResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied
  if (!INVOICE_STATUSES.includes(status)) return failed

  try {
    await prisma.invoice.update({
      where: { id },
      data: { status, paidAt: status === "paid" ? new Date() : null },
    })
  } catch (error) {
    console.error("Set Invoice Status Error:", error)
    return failed
  }
  revalidate()
  return { success: true }
}

export async function deleteInvoice(id: number): Promise<SimpleResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied

  try {
    await prisma.invoice.delete({ where: { id } })
  } catch (error) {
    console.error("Delete Invoice Error:", error)
    return failed
  }
  revalidate()
  return { success: true }
}

// ---------- Sending by email ----------

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

// Where the client opens the shared document. PUBLIC_ADMIN_URL wins (set it
// on the live server); otherwise the address this request came in on.
async function publicOrigin() {
  if (process.env.PUBLIC_ADMIN_URL) return process.env.PUBLIC_ADMIN_URL.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

const newToken = () => randomBytes(24).toString("base64url")

export async function sendDocumentEmail(formData: FormData): Promise<SimpleResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  const kind = formData.get("kind") as DocKind
  const id = Number(formData.get("id"))
  const to = (formData.get("to")?.toString() ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean)
  const subject = formData.get("subject")?.toString().trim() ?? ""
  const message = formData.get("message")?.toString().trim() ?? ""
  const includeLink = formData.get("includeLink") === "on"
  const file = formData.get("attachment")

  if (!mailConfigured()) {
    return {
      success: false,
      error: t(
        "Email sending isn't set up yet (SMTP_USER / SMTP_PASS missing in the admin .env).",
        "ยังไม่ได้ตั้งค่าการส่งอีเมล (ไม่มี SMTP_USER / SMTP_PASS ในไฟล์ .env ของแอดมิน)"
      ),
    }
  }
  if (to.length === 0 || !to.every((e) => EMAIL_RE.test(e))) {
    return { success: false, error: t("Enter a valid email address.", "กรุณากรอกอีเมลให้ถูกต้อง") }
  }
  if (!subject || !message) {
    return { success: false, error: t("Subject and message are required.", "กรุณากรอกหัวเรื่องและข้อความ") }
  }

  const attachments: MailAttachment[] = []
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { success: false, error: t("The attached file is too big (max 15 MB).", "ไฟล์แนบใหญ่เกินไป (สูงสุด 15 MB)") }
    }
    attachments.push({
      filename: file.name || "document.pdf",
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || undefined,
    })
  }
  if (!includeLink && attachments.length === 0) {
    return {
      success: false,
      error: t("Include the link or attach the PDF, so the client gets the document.", "กรุณาแนบลิงก์หรือไฟล์ PDF เพื่อให้ลูกค้าได้รับเอกสาร"),
    }
  }

  try {
    const origin = await publicOrigin()
    let title: string
    let rows: [string, string][]
    let token: string

    if (kind === "quotation") {
      const q = await prisma.quotation.findUnique({ where: { id } })
      if (!q) return failed
      token = q.shareToken ?? newToken()
      const totals = quotationTotals(q.sections as QuoteSection[], q.overheadPct, q.vatPct)
      title = `Quotation ${quotationLabel(q.number, q.revision)}`
      rows = [
        ["Project", q.projectName],
        ...(q.subject ? ([["Subject", q.subject]] as [string, string][]) : []),
        ["Date", formatThaiDate(q.date)],
        ["Grand total (incl. VAT)", `฿${formatMoney(totals.grandTotal)}`],
        ["Valid for", `${q.validityDays} days`],
      ]
    } else if (kind === "invoice") {
      const inv = await prisma.invoice.findUnique({ where: { id } })
      if (!inv) return failed
      token = inv.shareToken ?? newToken()
      const totals = invoiceTotals(inv.items as Item[], inv.vatPct, inv.withholdingPct)
      title = `Invoice ${inv.number}`
      rows = [
        ...(inv.projectName ? ([["Project", inv.projectName]] as [string, string][]) : []),
        ["Date", formatThaiDate(inv.date)],
        ...(inv.dueDate ? ([["Due date", formatThaiDate(inv.dueDate)]] as [string, string][]) : []),
        ["Amount due", `฿${formatMoney(totals.netPayable)}`],
      ]
    } else {
      return failed
    }

    const link = includeLink ? `${origin}/share/${kind === "quotation" ? "q" : "i"}/${token}` : null
    await sendMail({
      to: to.join(", "),
      subject,
      text: link ? `${message}\n\nView / download the ${kind}: ${link}` : message,
      html: documentEmailHtml({ message, title, rows, link, buttonLabel: `View / download ${kind}` }),
      attachments,
    })

    const sent = { sentAt: new Date(), sentTo: to.join(", "), ...(link ? { shareToken: token } : {}) }
    if (kind === "quotation") {
      const q = await prisma.quotation.update({ where: { id }, data: sent })
      if (q.status === "draft") await prisma.quotation.update({ where: { id }, data: { status: "sent" } })
    } else {
      await prisma.invoice.update({ where: { id }, data: sent })
    }
  } catch (error) {
    console.error("Send Document Email Error:", error)
    return {
      success: false,
      error: t(
        "The email couldn't be sent. Check the email settings and the address, then try again.",
        "ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอีเมลและที่อยู่อีเมล แล้วลองใหม่"
      ),
    }
  }

  revalidate()
  return { success: true }
}
