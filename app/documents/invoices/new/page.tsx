import { prisma } from "@/lib/prisma"
import InvoiceEditor from "@/components/documents/InvoiceEditor"
import { clientOptions, nextInvoiceNumber } from "@/lib/documents-server"
import { loadQuotationSource, requireDocumentAccess } from "@/lib/documents-forms"
import { emptyInvoiceItem, formatNumber, stageItem, toDateInput } from "@/lib/documents"

const DEFAULT_DUE_DAYS = 30

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ quotation?: string }> }) {
  await requireDocumentAccess()
  const { quotation } = await searchParams
  const [source, clients, number, last] = await Promise.all([
    quotation ? loadQuotationSource(Number(quotation)) : null,
    clientOptions(),
    nextInvoiceNumber(),
    prisma.invoice.findFirst({ orderBy: { createdAt: "desc" }, select: { note: true } }),
  ])

  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + DEFAULT_DUE_DAYS)

  // Start on the first stage that hasn't been billed yet.
  const stage = source?.stages.find((s) => !s.invoiced) ?? source?.stages[0]

  return (
    <InvoiceEditor
      id={null}
      source={source}
      clients={clients}
      initial={{
        number,
        quotationId: source?.id ?? null,
        stageLabel: stage ? `${stage.label} ${formatNumber(stage.percent)}%` : "",
        clientName: source?.clientName ?? "",
        clientEmail: source?.clientEmail ?? "",
        clientAddress: source?.clientAddress ?? "",
        clientTaxId: "",
        projectName: source?.projectName ?? "",
        date: toDateInput(today),
        dueDate: toDateInput(due),
        items: source && stage ? [stageItem(source, stage)] : [emptyInvoiceItem()],
        vatPct: source?.vatPct ?? 7,
        withholdingPct: 0,
        note: last?.note ?? "",
        status: "unpaid",
      }}
    />
  )
}
