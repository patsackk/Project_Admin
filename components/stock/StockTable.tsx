"use client"

import { useState, useTransition } from "react"
import toast from "react-hot-toast"
import { BellRing, ClipboardCheck, X } from "lucide-react"
import { recordCount, setItemCategory, setLowStockLevels } from "@/app/stock/actions"
import { useLanguage } from "@/components/LanguageProvider"
import Pagination from "@/components/Pagination"
import { STOCK_CATEGORIES, type StockStatus } from "@/lib/stock"
import type { Translate } from "@/lib/i18n"

export type StockRow = {
  id: number
  name: string
  otherName: string // the name in the other language, so search finds either
  brand: string
  unit: string
  category: string
  onHand: number
  minQty: number // low-stock level; 0 = not set
  lastChecked: string | null // ISO date of the latest stock check
  status: StockStatus
}

const PAGE_SIZE = 20

// Filter buttons, in this order; a category only gets a button if some item has it.
const FILTER_ORDER = ["Electrical", "WaterSup", "AirCon", "Tools"]

function categoryLabel(category: string, t: Translate) {
  const labels: Record<string, string> = {
    Electrical: t("Electrical", "ระบบไฟฟ้า"),
    WaterSup: t("WaterSup", "ระบบประปา"),
    AirCon: t("AirCon", "ระบบปรับอากาศ"),
    Tools: t("Tools", "เครื่องมือ"),
    Office: t("Office (hidden)", "สำนักงาน (ซ่อน)"),
  }
  return labels[category] ?? category
}

export default function StockTable({ rows, canManage }: { rows: StockRow[]; canManage: boolean }) {
  const { t, locale } = useLanguage()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [page, setPage] = useState(1)
  const [checking, setChecking] = useState<StockRow | null>(null)
  const [settingLevels, setSettingLevels] = useState(false)
  const [isPending, startTransition] = useTransition()

  const qty = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 3 })
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })

  const filters = ["All", ...FILTER_ORDER.filter((c) => rows.some((r) => r.category === c))]
  if (rows.some((r) => !r.category)) filters.push("")

  const filteredItems = rows.filter((item) => {
    const q = search.toLowerCase()
    return (
      `${item.name} ${item.otherName} ${item.brand}`.toLowerCase().includes(q) &&
      (filter === "All" || item.category === filter)
    )
  })

  // Stay on a valid page when filters shrink the list (or a save changes it).
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const checkedCount = rows.filter((r) => r.lastChecked).length
  const levelCount = rows.filter((r) => r.minQty > 0).length

  const changeCategory = (item: StockRow, category: string) => {
    startTransition(async () => {
      const result = await setItemCategory(item.id, category)
      if (!result.success) return void toast.error(result.error)
      toast.success(
        category === "Office"
          ? t("Moved to Office — hidden from this list", "ย้ายไปหมวดสำนักงานแล้ว — ซ่อนจากรายการนี้")
          : t("Category updated", "เปลี่ยนหมวดหมู่แล้ว")
      )
    })
  }

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <input
          type="text"
          placeholder={t("Search item name...", "ค้นหาชื่อสินค้า...")}
          className="input md:w-1/3"
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((cat) => (
            <button
              key={cat || "none"}
              onClick={() => {
                setFilter(cat)
                setPage(1)
              }}
              className={`${filter === cat ? "btn-primary" : "btn-secondary"} px-4 py-1.5`}
            >
              {cat === "All" ? t("All", "ทั้งหมด") : cat ? categoryLabel(cat, t) : t("Uncategorized", "ไม่มีหมวดหมู่")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <p className="text-xs text-gray-500">
          {t(
            `${checkedCount} of ${rows.length} items counted, ${levelCount} have a low-stock level.`,
            `นับแล้ว ${checkedCount} จาก ${rows.length} รายการ ตั้งระดับแจ้งเตือนแล้ว ${levelCount} รายการ`
          )}{" "}
          {t(
            "“Not counted yet” means nobody has checked the shelf for that item, so its amount is just what was bought for the warehouse and may not be accurate.",
            "“ยังไม่ได้นับ” หมายถึงยังไม่มีใครตรวจนับสินค้านั้นจริง จำนวนที่แสดงคือยอดที่ซื้อเข้าคลัง ซึ่งอาจไม่ตรงกับของจริง"
          )}
        </p>
        {canManage && (
          <button onClick={() => setSettingLevels(true)} className="btn-secondary shrink-0 px-4 py-1.5">
            <BellRing size={14} />
            {t("Set low-stock levels", "ตั้งระดับแจ้งเตือน")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Item Details", "รายละเอียดสินค้า")}</th>
              <th>{t("Category", "หมวดหมู่")}</th>
              <th className="text-right">{t("Amount", "จำนวน")}</th>
              <th>{t("Status", "สถานะ")}</th>
              {canManage && <th></th>}
            </tr>
          </thead>

          <tbody>
            {pageItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                </td>

                <td>
                  {canManage ? (
                    <select
                      value={item.category}
                      disabled={isPending}
                      onChange={(e) => changeCategory(item, e.target.value)}
                      className="rounded-full border-0 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-sky-500"
                    >
                      {!item.category && <option value="">{t("Uncategorized", "ไม่มีหมวดหมู่")}</option>}
                      {STOCK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabel(c, t)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-600">
                      {item.category ? categoryLabel(item.category, t) : "—"}
                    </span>
                  )}
                </td>

                <td className="text-right whitespace-nowrap">
                  <span className="font-semibold text-gray-900">{qty(item.onHand)}</span>{" "}
                  <span className="text-xs text-gray-400">{item.unit}</span>
                  <p className={`text-[11px] ${item.lastChecked ? "text-gray-400" : "text-amber-600"}`}>
                    {item.lastChecked
                      ? t(`Counted ${day(item.lastChecked)}`, `นับล่าสุด ${day(item.lastChecked)}`)
                      : t("Not counted yet", "ยังไม่ได้นับ")}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {item.minQty > 0
                      ? t(`Low at ${qty(item.minQty)}`, `แจ้งเตือนเมื่อเหลือ ${qty(item.minQty)}`)
                      : t("No low-stock level", "ยังไม่ตั้งระดับแจ้งเตือน")}
                  </p>
                </td>

                <td>
                  <StatusBadge status={item.status} t={t} />
                </td>

                {canManage && (
                  <td className="text-right">
                    <button onClick={() => setChecking(item)} className="btn-secondary px-3 py-1 text-xs">
                      <ClipboardCheck size={14} />
                      {t("Check", "ตรวจนับ")}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && <p className="empty-state">{t("No items found.", "ไม่พบสินค้า")}</p>}
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filteredItems.length} onChange={setPage} />

      {checking && <CheckModal item={checking} onClose={() => setChecking(null)} />}
      {settingLevels && (
        <LowLevelsModal
          categories={filters.filter((c) => c !== "All" && c !== "")}
          onClose={() => setSettingLevels(false)}
        />
      )}
    </>
  )
}

function CheckModal({ item, onClose }: { item: StockRow; onClose: () => void }) {
  const { t, locale } = useLanguage()
  const [amount, setAmount] = useState(String(item.onHand))
  const [minQty, setMinQty] = useState(String(item.minQty))
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const qty = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 3 })
  const counted = Number(amount)
  const diff = amount.trim() === "" || !Number.isFinite(counted) ? null : counted - item.onHand

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await recordCount(item.id, counted, Number(minQty) || 0, note)
      if (!result.success) return setError(result.error)
      toast.success(t("Amount saved", "บันทึกจำนวนแล้ว"))
      onClose()
    })
  }

  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="modal max-w-md">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="section-title">{t("Check amount", "ตรวจนับจำนวน")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.name}
              {item.brand && ` · ${item.brand}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "ปิด")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="alert-error">{error}</p>}

          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {t("In the system now:", "ยอดในระบบตอนนี้:")}{" "}
            <span className="font-semibold text-gray-900">
              {qty(item.onHand)} {item.unit}
            </span>
          </div>

          <div>
            <label className="label">
              {t(`Amount actually on the shelf (${item.unit})`, `จำนวนที่นับได้จริง (${item.unit})`)}
            </label>
            <input
              type="number"
              step="any"
              min={0}
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
            />
            {diff !== null && (
              <p
                className={`text-xs mt-1 ${
                  diff === 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-amber-600"
                }`}
              >
                {diff === 0
                  ? t("Matches the system — saved as checked.", "ตรงกับระบบ — บันทึกว่าตรวจนับแล้ว")
                  : diff < 0
                  ? t(`${qty(-diff)} ${item.unit} missing — the system will be corrected.`, `ขาดไป ${qty(-diff)} ${item.unit} — ระบบจะปรับยอดให้`)
                  : t(`${qty(diff)} ${item.unit} more than the system — it will be corrected.`, `มากกว่าระบบ ${qty(diff)} ${item.unit} — ระบบจะปรับยอดให้`)}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              {t(`Low-stock level (${item.unit})`, `แจ้งเตือนเมื่อเหลือ (${item.unit})`)}
            </label>
            <input
              type="number"
              step="any"
              min={0}
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {t(
                "When the amount drops to this number or below, the item shows as Low Stock. 0 = no warning.",
                "เมื่อจำนวนลดลงถึงหรือต่ำกว่าค่านี้ สินค้าจะแสดงเป็นใกล้หมด ใส่ 0 = ไม่แจ้งเตือน"
              )}
            </p>
          </div>

          <div>
            <label className="label">{t("Note (optional)", "หมายเหตุ (ไม่บังคับ)")}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("e.g. 20 taken to Cape 15", "เช่น เบิกไป Cape 15 จำนวน 20")}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <button disabled={isPending} className="btn-primary">
            {isPending ? t("Saving...", "กำลังบันทึก...") : t("Save", "บันทึก")}
          </button>
        </div>
      </form>
    </div>
  )
}

function LowLevelsModal({ categories, onClose }: { categories: string[]; onClose: () => void }) {
  const { t } = useLanguage()
  const [category, setCategory] = useState("All")
  const [level, setLevel] = useState("")
  const [onlyUnset, setOnlyUnset] = useState(true)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await setLowStockLevels(category, Number(level), onlyUnset)
      if (!result.success) return setError(result.error)
      toast.success(
        t(`Low-stock level set on ${result.updated ?? 0} items`, `ตั้งระดับแจ้งเตือนแล้ว ${result.updated ?? 0} รายการ`)
      )
      onClose()
    })
  }

  return (
    <div className="modal-backdrop">
      <form onSubmit={submit} className="modal max-w-md">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="section-title">{t("Set low-stock levels", "ตั้งระดับแจ้งเตือน")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("Apply one level to many items at once.", "ตั้งค่าเดียวให้หลายรายการพร้อมกัน")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "ปิด")}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="alert-error">{error}</p>}

          <div>
            <label className="label">{t("Items", "รายการ")}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="All">{t("All items", "ทุกรายการ")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c, t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t("Low-stock level", "แจ้งเตือนเมื่อเหลือ")}</label>
            <input
              type="number"
              step="any"
              min={0}
              required
              autoFocus
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="10"
              className="input"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {t(
                "In each item's own unit — e.g. 10 means 10 pieces for fittings and 10 lengths for pipes.",
                "ตามหน่วยของแต่ละสินค้า เช่น 10 คือ 10 ชิ้นสำหรับข้อต่อ และ 10 เส้นสำหรับท่อ"
              )}
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyUnset}
              onChange={(e) => setOnlyUnset(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              {t(
                "Only items that don't have a level yet (keep levels already set)",
                "เฉพาะรายการที่ยังไม่ได้ตั้งค่า (ไม่เปลี่ยนค่าที่ตั้งไว้แล้ว)"
              )}
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t("Cancel", "ยกเลิก")}
          </button>
          <button disabled={isPending} className="btn-primary">
            {isPending ? t("Saving...", "กำลังบันทึก...") : t("Apply", "นำไปใช้")}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatusBadge({ status, t }: { status: StockStatus; t: Translate }) {
  const base = "badge"

  if (status === "in") {
    return <span className={`${base} bg-green-100 text-green-700`}>{t("In Stock", "มีสินค้า")}</span>
  }

  if (status === "low") {
    return <span className={`${base} bg-amber-100 text-amber-700`}>{t("Low Stock", "ใกล้หมด")}</span>
  }

  return <span className={`${base} bg-red-100 text-red-700`}>{t("Out of Stock", "สินค้าหมด")}</span>
}
