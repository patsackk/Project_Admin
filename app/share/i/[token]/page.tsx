import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isShareToken } from "@/lib/share"
import { quotationLabel, type InvoiceItem } from "@/lib/documents"
import PrintToolbar from "@/components/documents/PrintToolbar"
import InvoiceDocument from "@/components/documents/InvoiceDocument"

async function find(token: string) {
  return isShareToken(token)
    ? prisma.invoice.findUnique({ where: { shareToken: token }, include: { quotation: true } })
    : null
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const inv = await find((await params).token)
  return { title: inv ? `${inv.number} ${inv.clientName}` : "Invoice", robots: { index: false } }
}

// What the client sees from the emailed link: the invoice, read-only.
export default async function SharedInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const inv = await find((await params).token)
  if (!inv) notFound()

  return (
    <div className="doc-viewer">
      <PrintToolbar />
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
