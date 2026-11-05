import QuotationEditor from "@/components/documents/QuotationEditor"
import { clientOptions, nextQuotationSeq } from "@/lib/documents-server"
import { projectOptions, requireDocumentAccess } from "@/lib/documents-forms"
import { DEFAULT_CONDITIONS, DEFAULT_PAYMENT_TERMS, emptyLine, toDateInput } from "@/lib/documents"

export default async function NewQuotationPage() {
  await requireDocumentAccess()
  const [projects, clients, nextSeq] = await Promise.all([projectOptions(), clientOptions(), nextQuotationSeq()])

  return (
    <QuotationEditor
      id={null}
      initial={{
        number: "",
        revision: 0,
        projectId: null,
        projectName: "",
        clientName: "",
        clientEmail: "",
        clientAddress: "",
        subject: "",
        date: toDateInput(new Date()),
        validityDays: 30,
        overheadPct: 15,
        vatPct: 7,
        sections: [{ title: "", lines: [emptyLine("group"), emptyLine("item")] }],
        paymentTerms: DEFAULT_PAYMENT_TERMS,
        conditions: DEFAULT_CONDITIONS,
        status: "draft",
      }}
      projects={projects}
      clients={clients}
      nextSeq={nextSeq}
    />
  )
}
