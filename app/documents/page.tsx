import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"
import { nextQuotationSeq } from "@/lib/documents-server"
import {
  invoiceTotals,
  quotationLabel,
  quotationTotals,
  type InvoiceItem,
  type InvoiceStatus,
  type QuotationStatus,
  type QuoteSection,
} from "@/lib/documents"
import DocumentLists, { type InvoiceRow, type QuotationRow } from "@/components/documents/DocumentLists"

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const t = await getT()
  const { tab } = await searchParams
  const canManage = await hasAccess("manageDocuments")

  const [quotations, invoices, nextSeq] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: [{ date: "desc" }, { revision: "desc" }],
      include: { _count: { select: { invoices: true } } },
    }),
    prisma.invoice.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { quotation: { select: { number: true, revision: true } } },
    }),
    nextQuotationSeq(),
  ])

  const quotationRows: QuotationRow[] = quotations.map((q) => ({
    id: q.id,
    label: quotationLabel(q.number, q.revision),
    projectName: q.projectName,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    subject: q.subject,
    date: q.date.toISOString(),
    sentAt: q.sentAt?.toISOString() ?? null,
    sentTo: q.sentTo,
    grandTotal: quotationTotals(q.sections as QuoteSection[], q.overheadPct, q.vatPct).grandTotal,
    status: q.status as QuotationStatus,
    invoiceCount: q._count.invoices,
  }))

  const today = new Date()
  const invoiceRows: InvoiceRow[] = invoices.map((i) => ({
    id: i.id,
    number: i.number,
    quotationLabel: i.quotation ? quotationLabel(i.quotation.number, i.quotation.revision) : "",
    stageLabel: i.stageLabel,
    clientName: i.clientName,
    clientEmail: i.clientEmail,
    projectName: i.projectName,
    date: i.date.toISOString(),
    sentAt: i.sentAt?.toISOString() ?? null,
    sentTo: i.sentTo,
    dueDate: i.dueDate?.toISOString() ?? null,
    netPayable: invoiceTotals(i.items as InvoiceItem[], i.vatPct, i.withholdingPct).netPayable,
    status: i.status as InvoiceStatus,
    overdue: i.status === "unpaid" && !!i.dueDate && i.dueDate < today,
  }))

  return (
    <div className="page">
      <div>
        <h1 className="page-title">{t("Quotations & Invoices", "ใบเสนอราคาและใบแจ้งหนี้")}</h1>
        <p className="page-subtitle">
          {t(
            "Make quotations in the company format, bill each payment stage, and print or save them as PDF.",
            "สร้างใบเสนอราคาตามแบบฟอร์มบริษัท ออกใบแจ้งหนี้ตามงวดชำระ และพิมพ์หรือบันทึกเป็น PDF"
          )}
        </p>
      </div>

      <DocumentLists
        tab={tab === "invoices" ? "invoices" : "quotations"}
        quotations={quotationRows}
        invoices={invoiceRows}
        canManage={canManage}
        nextSeq={nextSeq}
      />
    </div>
  )
}
