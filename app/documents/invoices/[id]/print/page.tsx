import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { invoiceTotals, quotationLabel, type InvoiceItem } from "@/lib/documents"
import SendEmailButton from "@/components/documents/SendEmailButton"
import PrintToolbar from "@/components/documents/PrintToolbar"
import InvoiceDocument from "@/components/documents/InvoiceDocument"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const i = await prisma.invoice.findUnique({ where: { id: Number((await params).id) || 0 } })
  return { title: i ? `${i.number} ${i.clientName}` : "Invoice" }
}

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const inv = Number.isInteger(id)
    ? await prisma.invoice.findUnique({ where: { id }, include: { quotation: true } })
    : null
  if (!inv) notFound()
  const canManage = await hasAccess("manageDocuments")

  return (
    <div className="doc-viewer">
      <PrintToolbar
        backHref="/documents?tab=invoices"
        editHref={canManage ? `/documents/invoices/${inv.id}` : undefined}
        actions={
          canManage && (
            <SendEmailButton
              variant="button"
              doc={{
                kind: "invoice",
                id: inv.id,
                label: inv.number,
                clientName: inv.clientName,
                clientEmail: inv.clientEmail,
                projectName: inv.projectName,
                amount: invoiceTotals(inv.items as InvoiceItem[], inv.vatPct, inv.withholdingPct).netPayable,
                dueDate: inv.dueDate?.toISOString() ?? null,
                sentAt: inv.sentAt?.toISOString() ?? null,
                sentTo: inv.sentTo,
              }}
            />
          )
        }
      />
      <InvoiceDocument
        inv={{
          ...inv,
          items: inv.items as InvoiceItem[],
          quotationLabel: inv.quotation ? quotationLabel(inv.quotation.number, inv.quotation.revision) : "",
        }}
      />
    </div>
  )
}
