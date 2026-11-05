import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { quotationLabel, quotationTotals, type PaymentStage, type QuoteSection } from "@/lib/documents"
import SendEmailButton from "@/components/documents/SendEmailButton"
import PrintToolbar from "@/components/documents/PrintToolbar"
import QuotationDocument from "@/components/documents/QuotationDocument"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const q = await prisma.quotation.findUnique({ where: { id: Number((await params).id) || 0 } })
  // The browser suggests this as the PDF file name.
  return { title: q ? `${quotationLabel(q.number, q.revision)} ${q.subject}`.trim() : "Quotation" }
}

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const q = Number.isInteger(id) ? await prisma.quotation.findUnique({ where: { id } }) : null
  if (!q) notFound()
  const canManage = await hasAccess("manageDocuments")

  return (
    <div className="doc-viewer">
      <PrintToolbar
        backHref="/documents"
        editHref={canManage ? `/documents/quotations/${q.id}` : undefined}
        actions={
          canManage && (
            <SendEmailButton
              variant="button"
              doc={{
                kind: "quotation",
                id: q.id,
                label: quotationLabel(q.number, q.revision),
                clientName: q.clientName,
                clientEmail: q.clientEmail,
                projectName: q.projectName,
                subject: q.subject,
                amount: quotationTotals(q.sections as QuoteSection[], q.overheadPct, q.vatPct).grandTotal,
                sentAt: q.sentAt?.toISOString() ?? null,
                sentTo: q.sentTo,
              }}
            />
          )
        }
      />
      <QuotationDocument
        q={{
          ...q,
          sections: q.sections as QuoteSection[],
          paymentTerms: q.paymentTerms as PaymentStage[],
        }}
      />
    </div>
  )
}
