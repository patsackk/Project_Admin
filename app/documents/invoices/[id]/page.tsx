import InvoiceEditor from "@/components/documents/InvoiceEditor"
import { clientOptions } from "@/lib/documents-server"
import { loadInvoiceInput, loadQuotationSource, requireDocumentAccess } from "@/lib/documents-forms"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireDocumentAccess()
  const id = Number((await params).id)
  const [{ input, quotationId }, clients] = await Promise.all([loadInvoiceInput(id), clientOptions()])
  const source = quotationId ? await loadQuotationSource(quotationId) : null

  return <InvoiceEditor id={id} initial={input} source={source} clients={clients} />
}
