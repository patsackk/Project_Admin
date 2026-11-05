import QuotationEditor from "@/components/documents/QuotationEditor"
import { clientOptions, nextQuotationSeq } from "@/lib/documents-server"
import { loadQuotationInput, projectOptions, requireDocumentAccess } from "@/lib/documents-forms"

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireDocumentAccess()
  const id = Number((await params).id)
  const [initial, projects, clients, nextSeq] = await Promise.all([
    loadQuotationInput(id),
    projectOptions(),
    clientOptions(),
    nextQuotationSeq(),
  ])

  return <QuotationEditor id={id} initial={initial} projects={projects} clients={clients} nextSeq={nextSeq} />
}
