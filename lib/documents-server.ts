import { prisma } from "@/lib/prisma"

// The next running number for this year's quotations, read from the numbers
// already used (Q-XX-UTO-007-26 → 8). Revisions share a number, so they
// don't count twice.
export async function nextQuotationSeq() {
  const yy = String(new Date().getFullYear()).slice(-2)
  const rows = await prisma.quotation.findMany({ select: { number: true }, distinct: ["number"] })
  let max = 0
  for (const { number } of rows) {
    const m = number.match(/-(\d+)-(\d{2})$/)
    if (m && m[2] === yy) max = Math.max(max, Number(m[1]))
  }
  return max + 1
}

// INV-26-001, INV-26-002… restarting each year.
export async function nextInvoiceNumber() {
  const yy = String(new Date().getFullYear()).slice(-2)
  const rows = await prisma.invoice.findMany({
    where: { number: { startsWith: `INV-${yy}-` } },
    select: { number: true },
  })
  let max = 0
  for (const { number } of rows) {
    const n = Number(number.split("-")[2])
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  return `INV-${yy}-${String(max + 1).padStart(3, "0")}`
}

// Clients with their project, for the "fill from client" picker.
export async function clientOptions() {
  const clients = await prisma.client.findMany({
    include: { user: true, project: true },
    orderBy: { id: "desc" },
  })
  return clients.map((c) => ({
    id: c.id,
    name: c.user.name,
    email: c.user.email,
    address: c.user.address || c.location,
    projectId: c.projectId,
    projectName: c.project?.name ?? "",
  }))
}

export type ClientOption = Awaited<ReturnType<typeof clientOptions>>[number]
