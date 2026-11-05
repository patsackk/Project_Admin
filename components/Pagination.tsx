"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

// Page numbers to show: always first and last, the current page and its
// neighbours, with "…" for the gaps. e.g. 1 … 4 5 6 … 12
function pageList(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | "gap")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap")
    result.push(p)
  })
  return result
}

export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  const { t } = useLanguage()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const button = "min-w-8 h-8 px-2 flex items-center justify-center rounded-full text-sm transition"

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        {t(`Showing ${from}–${to} of ${total}`, `แสดง ${from}–${to} จาก ${total} รายการ`)}
      </p>

      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label={t("Pagination", "การแบ่งหน้า")}>
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            aria-label={t("Previous page", "หน้าก่อนหน้า")}
            className={`${button} text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent`}
          >
            <ChevronLeft size={16} />
          </button>

          {pageList(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${button} ${p === page ? "bg-sky-600 font-semibold text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onChange(page + 1)}
            disabled={page === pageCount}
            aria-label={t("Next page", "หน้าถัดไป")}
            className={`${button} text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent`}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  )
}
