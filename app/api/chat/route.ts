import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stockItems } from "@/lib/stockData"

const AI_BASE_URL = process.env.AI_BASE_URL ?? "https://ai.psu.blue/v1"
const AI_MODEL = process.env.AI_MODEL ?? "openai/gpt-5.6-luna"
const AI_API_KEY = process.env.AI_API_KEY

export async function POST(req: Request) {
  if (!AI_API_KEY) {
    return NextResponse.json(
      { error: "AI_API_KEY is not set in .env" },
      { status: 500 }
    )
  }

  const { messages } = await req.json()

  const [schedules, projects, workers, clients, history, contactForms, users] =
    await Promise.all([
      prisma.schedule.findMany({
        include: { worker: true, project: true },
        orderBy: { date: "asc" },
      }),
      prisma.project.findMany(),
      prisma.worker.findMany(),
      prisma.client.findMany({ include: { user: true, project: true } }),
      prisma.history.findMany({ include: { user: true } }),
      prisma.contactForm.findMany(),
      prisma.user.findMany(),
    ])

  const scheduleSummary = schedules.map((s) => ({
    project: s.project.name,
    location: s.project.location,
    worker: s.worker.name,
    team: s.worker.team,
    date: s.date.toISOString().slice(0, 10),
    time: `${s.startTime}-${s.endTime}`,
  }))

  const stockSummary = stockItems.map((i) => ({
    name: i.name,
    category: i.category,
    status: i.status,
  }))

  const projectSummary = projects.map((p) => ({
    name: p.name,
    location: p.location,
  }))

  const workerSummary = workers.map((w) => ({
    name: w.name,
    team: w.team,
  }))

  const clientSummary = clients.map((c) => ({
    name: c.user.name,
    email: c.user.email,
    phone: c.user.phone,
    location: c.location,
    project: c.project?.name ?? "No project assigned",
  }))

  const historySummary = history.map((h) => ({
    client: h.user.name,
    project: h.projectName,
    location: h.location,
    completedAt: h.completedAt.toISOString().slice(0, 10),
  }))

  const contactFormSummary = contactForms.map((c) => ({
    name: c.name,
    email: c.email,
    message: c.message,
    createdAt: c.createdAt.toISOString().slice(0, 10),
  }))

  const userSummary = users.map((u) => ({
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
  }))

  const systemPrompt = `You are an admin assistant for a facilities management dashboard.
Answer questions using ONLY the data given below (projects, workers, schedules, stock/inventory, clients, completed job history, contact form submissions, and users).
There is currently no finance data tracked in the system, so if asked about finance, say that finance tracking isn't set up yet instead of making up numbers.
Format every answer in Markdown so it is easy to read: use short paragraphs, bullet or numbered lists, and **bold** for key labels/values. Avoid large blocks of unformatted text.
Be concise.

PROJECTS:
${JSON.stringify(projectSummary)}

WORKERS:
${JSON.stringify(workerSummary)}

SCHEDULE DATA:
${JSON.stringify(scheduleSummary)}

STOCK DATA:
${JSON.stringify(stockSummary)}

CLIENTS:
${JSON.stringify(clientSummary)}

COMPLETED JOB HISTORY:
${JSON.stringify(historySummary)}

CONTACT FORM SUBMISSIONS:
${JSON.stringify(contactFormSummary)}

REGISTERED USERS:
${JSON.stringify(userSummary)}`

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      stream: false,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: `AI request failed: ${res.status} ${text}` },
      { status: 502 }
    )
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content ?? "No response."

  return NextResponse.json({ reply })
}
