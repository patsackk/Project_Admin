import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import {
  formatNumber,
  quotationLabel,
  quotationTotals,
  toDateInput,
  type InvoiceItem,
  type PaymentStage,
  type QuoteSection,
  type QuotationSource,
} from "@/lib/documents"
import type { InvoiceInput, QuotationInput } from "@/app/documents/actions"

// Editor pages are for people who may change documents; everyone else is
// sent back to the list (where they can still view and print).
export async function requireDocumentAccess() {
  if (!(await hasAccess("manageDocuments"))) redirect("/documents")
}

export async function projectOptions() {
  return prisma.project.findMany({ select: { id: true, name: true, location: true }, orderBy: { name: "asc" } })
}

export async function loadQuotationInput(id: number): Promise<QuotationInput> {
  const q = Number.isInteger(id) ? await prisma.quotation.findUnique({ where: { id } }) : null
  if (!q) notFound()
  return {
    number: q.number,
    revision: q.revision,
    projectId: q.projectId,
    projectName: q.projectName,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientAddress: q.clientAddress,
    subject: q.subject,
    date: toDateInput(q.date),
    validityDays: q.validityDays,
    overheadPct: q.overheadPct,
    vatPct: q.vatPct,
    sections: q.sections as QuoteSection[],
    paymentTerms: q.paymentTerms as PaymentStage[],
    conditions: q.conditions,
    status: q.status as QuotationInput["status"],
  }
}

// A quotation as the invoice editor needs it: who to bill and what each
// payment stage is worth (and whether it has been billed already).
export async function loadQuotationSource(id: number): Promise<QuotationSource | null> {
  const q = Number.isInteger(id)
    ? await prisma.quotation.findUnique({ where: { id }, include: { invoices: { select: { stageLabel: true } } } })
    : null
  if (!q) return null
  const billed = new Set(q.invoices.map((i) => i.stageLabel))
  return {
    id: q.id,
    label: quotationLabel(q.number, q.revision),
    subject: q.subject,
    projectName: q.projectName,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientAddress: q.clientAddress,
    totalCost: quotationTotals(q.sections as QuoteSection[], q.overheadPct, q.vatPct).totalCost,
    vatPct: q.vatPct,
    stages: (q.paymentTerms as PaymentStage[]).map((s) => ({
      ...s,
      invoiced: billed.has(`${s.label} ${formatNumber(s.percent)}%`),
    })),
  }
}

export async function loadInvoiceInput(id: number): Promise<{ input: InvoiceInput; quotationId: number | null }> {
  const i = Number.isInteger(id) ? await prisma.invoice.findUnique({ where: { id } }) : null
  if (!i) notFound()
  return {
    quotationId: i.quotationId,
    input: {
      number: i.number,
      quotationId: i.quotationId,
      stageLabel: i.stageLabel,
      clientName: i.clientName,
      clientEmail: i.clientEmail,
      clientAddress: i.clientAddress,
      clientTaxId: i.clientTaxId,
      projectName: i.projectName,
      date: toDateInput(i.date),
      dueDate: i.dueDate ? toDateInput(i.dueDate) : "",
      items: i.items as InvoiceItem[],
      vatPct: i.vatPct,
      withholdingPct: i.withholdingPct,
      note: i.note,
      status: i.status as InvoiceInput["status"],
    },
  }
}
