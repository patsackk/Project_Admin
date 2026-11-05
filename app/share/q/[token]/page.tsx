import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isShareToken } from "@/lib/share"
import { quotationLabel, type PaymentStage, type QuoteSection } from "@/lib/documents"
import PrintToolbar from "@/components/documents/PrintToolbar"
import QuotationDocument from "@/components/documents/QuotationDocument"

async function find(token: string) {
  return isShareToken(token) ? prisma.quotation.findUnique({ where: { shareToken: token } }) : null
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const q = await find((await params).token)
  return {
    title: q ? `${quotationLabel(q.number, q.revision)} ${q.subject}`.trim() : "Quotation",
    robots: { index: false },
  }
}

// What the client sees from the emailed link: the quotation, read-only.
export default async function SharedQuotationPage({ params }: { params: Promise<{ token: string }> }) {
  const q = await find((await params).token)
  if (!q) notFound()

  return (
    <div className="doc-viewer">
      <PrintToolbar />
      <QuotationDocument
        q={{ ...q, sections: q.sections as QuoteSection[], paymentTerms: q.paymentTerms as PaymentStage[] }}
      />
    </div>
  )
}
