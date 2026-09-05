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

  const schedules = await prisma.schedule.findMany({
    include: { worker: true, project: true },
    orderBy: { date: "asc" },
  })

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

  const systemPrompt = `You are an admin assistant for a facilities management dashboard.
Answer questions about stock/inventory, schedules, and finance using ONLY the data given below.
There is currently no finance data tracked in the system, so if asked about finance, say that finance tracking isn't set up yet instead of making up numbers.
Be concise.

SCHEDULE DATA:
${JSON.stringify(scheduleSummary)}

STOCK DATA:
${JSON.stringify(stockSummary)}`

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
