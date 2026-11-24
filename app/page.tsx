import Link from "next/link"
import { ArrowRight, CalendarDays, ClipboardList, MessageSquare, Users, type LucideIcon } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getLang } from "@/lib/i18n-server"
import { dateLocale, makeT, type Lang } from "@/lib/i18n"
import { HIDDEN_CATEGORY, stockStatus } from "@/lib/stock"

const DAY = 24 * 60 * 60 * 1000
const BANGKOK_OFFSET = 7 * 60 * 60 * 1000

// Schedules store each day as midnight UTC, so "this week" is Monday 00:00
// UTC to the next Monday, counted from today's date in Thailand.
function thisWeek() {
  const today = new Date(Date.now() + BANGKOK_OFFSET)
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const monday = start - ((today.getUTCDay() + 6) % 7) * DAY
  return { gte: new Date(monday), lt: new Date(monday + 7 * DAY) }
}

function timeAgo(date: Date, lang: Lang) {
  const rtf = new Intl.RelativeTimeFormat(dateLocale(lang), { numeric: "auto" })
  const minutes = Math.round((date.getTime() - Date.now()) / 60000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour")
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, "day")
  return date.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric" })
}

type Activity = { at: Date; text: string; href: string }

export default async function Home() {
  const lang = await getLang()
  const t = makeT(lang)

  const [
    projectCount,
    clientCount,
    jobsThisWeek,
    newMessages,
    stockSums,
    statusUpdates,
    quotations,
    invoices,
    messages,
    completed,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.client.count(),
    prisma.schedule.count({ where: { date: thisWeek() } }),
    prisma.contactForm.count({ where: { reply: null } }),
    prisma.stockMovement.groupBy({ by: ["itemId"], _sum: { delta: true } }),
    prisma.statusUpdate.findMany({
      where: { isDraft: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { author: { select: { name: true } }, project: true, client: { include: { project: true } } },
    }),
    prisma.quotation.findMany({ where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" }, take: 6 }),
    prisma.invoice.findMany({ where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" }, take: 6 }),
    prisma.contactForm.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.history.findMany({ orderBy: { completedAt: "desc" }, take: 6 }),
  ])

  // Low inventory: same rule as the Stock page, worst first.
  const onHandById = new Map(stockSums.map((s) => [s.itemId, s._sum.delta ?? 0]))
  const stockItems = await prisma.stockItem.findMany({
    where: { id: { in: [...onHandById.keys()] }, category: { not: HIDDEN_CATEGORY } },
  })
  const lowStock = stockItems
    .map((i) => {
      const onHand = onHandById.get(i.id) ?? 0
      return {
        id: i.id,
        name: lang === "th" || !i.nameEn ? i.name : i.nameEn,
        onHand,
        status: stockStatus(onHand, i.minQty),
      }
    })
    .filter((i) => i.status !== "in")
    .sort((a, b) => (a.status === b.status ? a.onHand - b.onHand : a.status === "out" ? -1 : 1))

  // Recent activity from every part of the system, newest first.
  const activity: Activity[] = [
    ...statusUpdates.map((u) => {
      const project = u.project?.name ?? u.client?.project?.name
      return {
        at: u.createdAt,
        text: t(
          `${u.author.name} posted a status update${project ? ` · ${project}` : ""}`,
          `${u.author.name} อัปเดตสถานะงาน${project ? ` · ${project}` : ""}`
        ),
        href: "/status",
      }
    }),
    ...quotations.map((q) => ({
      at: q.sentAt!,
      text: t(`Quotation ${q.number} sent to ${q.clientName}`, `ส่งใบเสนอราคา ${q.number} ถึง ${q.clientName}`),
      href: `/documents/quotations/${q.id}/print`,
    })),
    ...invoices.map((i) => ({
      at: i.sentAt!,
      text: t(`Invoice ${i.number} sent to ${i.clientName}`, `ส่งใบแจ้งหนี้ ${i.number} ถึง ${i.clientName}`),
      href: `/documents/invoices/${i.id}/print`,
    })),
    ...messages.flatMap((m) => [
      { at: m.createdAt, text: t(`New message from ${m.name}`, `ข้อความใหม่จาก ${m.name}`), href: "/messages" },
      ...(m.repliedAt
        ? [{ at: m.repliedAt, text: t(`Replied to ${m.name}`, `ตอบกลับ ${m.name} แล้ว`), href: "/messages" }]
        : []),
    ]),
    ...completed.map((h) => ({
      at: h.completedAt,
      text: t(`Project ${h.projectName} completed`, `โครงการ ${h.projectName} เสร็จสมบูรณ์`),
      href: "/history",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6)

  const stats: { icon: LucideIcon; value: number; label: string; href: string }[] = [
    { icon: ClipboardList, value: projectCount, label: t("Active projects", "โครงการที่ดำเนินอยู่"), href: "/project" },
    { icon: Users, value: clientCount, label: t("Clients", "ลูกค้า"), href: "/clients" },
    { icon: CalendarDays, value: jobsThisWeek, label: t("Jobs this week", "งานสัปดาห์นี้"), href: "/schedule" },
    { icon: MessageSquare, value: newMessages, label: t("New messages", "ข้อความใหม่"), href: "/messages" },
  ]

  const shortcuts = [
    { label: t("Schedule", "ตารางงาน"), href: "/schedule" },
    { label: t("Status Updates", "อัปเดตสถานะงาน"), href: "/status" },
    { label: t("Quotations & Invoices", "ใบเสนอราคา/ใบแจ้งหนี้"), href: "/documents" },
    { label: t("Stock", "คลังวัสดุ"), href: "/stock" },
    { label: t("Messages", "ข้อความ"), href: "/messages" },
    { label: t("Website Content", "เนื้อหาเว็บไซต์"), href: "/content" },
  ]

  return (
    <div className="page">
      <h1 className="page-title">{t("Dashboard", "แดชบอร์ด")}</h1>

      {/* KEY NUMBERS */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label, href }) => (
          <Link
            key={href}
            href={href}
            className="card flex min-w-0 items-center gap-3 p-3.5 transition hover:border-sky-200 hover:shadow-md sm:gap-4 sm:p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 sm:h-12 sm:w-12">
              <Icon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{value}</span>
              <span className="block text-xs leading-snug text-gray-500 sm:text-sm">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* QUICK ACCESS */}
        <section className="card min-w-0 p-4 sm:p-5 lg:col-span-3">
          <h2 className="section-title mb-4">{t("Quick Access", "เมนูลัด")}</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex min-h-[3.5rem] min-w-0 items-center rounded-xl border border-sky-100 bg-sky-50 px-3 py-3 sm:px-4 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
              >
                <span>
                  {s.label}
                  <ArrowRight size={15} className="ml-1.5 inline-block transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* LOW INVENTORY */}
        <section className="card min-w-0 p-4 sm:p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="section-title">{t("Low Inventory", "วัสดุใกล้หมด")}</h2>
            <Link href="/stock" className="back-link text-xs">
              {t("View stock →", "ดูคลังวัสดุ →")}
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              {t("Everything is in stock.", "วัสดุทุกรายการมีเพียงพอ")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lowStock.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-gray-800">{item.name}</span>
                  {item.status === "out" ? (
                    <span className="badge bg-red-100 text-red-700">{t("Out of stock", "หมด")}</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700">{t("Low", "ใกล้หมด")}</span>
                  )}
                </li>
              ))}
              {lowStock.length > 5 && (
                <li className="pt-2.5 text-xs text-gray-500">
                  {t(`and ${lowStock.length - 5} more`, `และอีก ${lowStock.length - 5} รายการ`)}
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      {/* RECENT ACTIVITY */}
      <section className="card p-4 sm:p-5">
        <h2 className="section-title mb-2">{t("Recent Activity", "กิจกรรมล่าสุด")}</h2>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{t("Nothing yet.", "ยังไม่มีกิจกรรม")}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activity.map((a, i) => (
              <li key={i}>
                <Link
                  href={a.href}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition hover:bg-sky-50"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600" />
                  <span className="min-w-0 flex-1 text-gray-800">{a.text}</span>
                  <span className="shrink-0 text-xs text-gray-400">{timeAgo(a.at, lang)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
