import { prisma } from "@/lib/prisma"
import { hasAccess } from "@/lib/permissions"
import { getLang } from "@/lib/i18n-server"
import { makeT } from "@/lib/i18n"
import { HIDDEN_CATEGORY, stockStatus } from "@/lib/stock"
import StockTable, { type StockRow } from "@/components/stock/StockTable"

// Lists up to three names, then "and N more".
function nameList(names: string[], more: (n: number) => string) {
  const shown = names.slice(0, 3).join(", ")
  return names.length > 3 ? `${shown} ${more(names.length - 3)}` : shown
}

export default async function StockPage() {
  const lang = await getLang()
  const t = makeT(lang)
  const canManage = await hasAccess("manageStock")

  // Warehouse stock on hand = sum of each item's movements. Office items are
  // bought through the warehouse too but aren't site stock, so skip them.
  const sums = await prisma.stockMovement.groupBy({ by: ["itemId"], _sum: { delta: true } })
  const onHandById = new Map(sums.map((s) => [s.itemId, s._sum.delta ?? 0]))
  const items = await prisma.stockItem.findMany({
    where: { id: { in: [...onHandById.keys()] }, category: { not: HIDDEN_CATEGORY } },
  })
  const lastCounts = await prisma.stockMovement.groupBy({
    by: ["itemId"],
    where: { type: "count" },
    _max: { createdAt: true },
  })
  const lastCheckedById = new Map(lastCounts.map((c) => [c.itemId, c._max.createdAt]))

  const rows: StockRow[] = items.map((i) => {
    const onHand = Math.round((onHandById.get(i.id) ?? 0) * 1000) / 1000
    // English by default; the Thai purchase name in Thai mode, or when no
    // English name has been set yet.
    const name = lang === "th" || !i.nameEn ? i.name : i.nameEn
    return {
      id: i.id,
      name,
      otherName: name === i.name ? i.nameEn : i.name,
      brand: i.brand,
      unit: i.unit,
      category: i.category,
      onHand,
      minQty: i.minQty,
      lastChecked: lastCheckedById.get(i.id)?.toISOString() ?? null,
      status: stockStatus(onHand, i.minQty),
    }
  })
  rows.sort((a, b) => a.name.localeCompare(b.name, lang))

  const out = rows.filter((r) => r.status === "out").map((r) => r.name)
  const low = rows.filter((r) => r.status === "low").map((r) => r.name)
  const more = (n: number) => t(`and ${n} more`, `และอีก ${n} รายการ`)

  return (
    <div className="page">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t("Inventory & Stock", "คลังวัสดุและอุปกรณ์")}</h1>
          <p className="page-subtitle">
            {t(
              "Manage and track installation components and equipment.",
              "จัดการและติดตามชิ้นส่วนและอุปกรณ์สำหรับงานติดตั้ง"
            )}
          </p>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-semibold">
            {t("Out of Stock", "สินค้าหมด")} ({out.length})
          </p>
          <p className="text-sm text-gray-600">
            {out.length > 0
              ? t(`${nameList(out, more)} completely depleted.`, `${nameList(out, more)} หมดสต็อกแล้ว`)
              : t("Nothing is out of stock.", "ไม่มีสินค้าที่หมดสต็อก")}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-700 font-semibold">
            {t("Low Inventory", "สินค้าใกล้หมด")} ({low.length})
          </p>
          <p className="text-sm text-gray-600">
            {low.length > 0
              ? t(`${nameList(low, more)} running low.`, `${nameList(low, more)} เหลือน้อย`)
              : t("Nothing is running low.", "ไม่มีสินค้าที่ใกล้หมด")}
          </p>
        </div>
      </div>

      <StockTable rows={rows} canManage={canManage} />
    </div>
  )
}
