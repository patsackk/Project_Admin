"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { hasAccess } from "@/lib/permissions"
import { getT } from "@/lib/i18n-server"
import { HIDDEN_CATEGORY, STOCK_CATEGORIES } from "@/lib/stock"

export type StockResult = { success: true } | { success: false; error: string }

async function guard() {
  const t = await getT()
  const allowed = await hasAccess("manageStock")
  const denied = {
    success: false as const,
    error: t("You don't have permission to change stock.", "คุณไม่มีสิทธิ์แก้ไขข้อมูลสต็อก"),
  }
  const failed = {
    success: false as const,
    error: t("Something went wrong. Please try again.", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"),
  }
  return { t, allowed, denied, failed }
}

export async function setItemCategory(itemId: number, category: string): Promise<StockResult> {
  const { allowed, denied, failed } = await guard()
  if (!allowed) return denied
  if (category !== "" && !(STOCK_CATEGORIES as readonly string[]).includes(category)) return failed

  try {
    await prisma.stockItem.update({ where: { id: itemId }, data: { category } })
  } catch (error) {
    console.error("Set Item Category Error:", error)
    return failed
  }

  revalidatePath("/stock")
  return { success: true }
}

// Stock check: records what's actually on the shelf. The difference from
// the current figure is stored as a "count" movement, so history keeps both.
// Also saves the item's low-stock level, which is set in the same popup.
export async function recordCount(
  itemId: number,
  countedQty: number,
  minQty: number,
  note: string
): Promise<StockResult> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  if (!Number.isFinite(countedQty) || countedQty < 0) {
    return { success: false, error: t("Please enter a valid amount.", "กรุณากรอกจำนวนให้ถูกต้อง") }
  }
  if (!Number.isFinite(minQty) || minQty < 0) {
    return { success: false, error: t("Please enter a valid low-stock level.", "กรุณากรอกระดับแจ้งเตือนให้ถูกต้อง") }
  }

  try {
    await prisma.stockItem.update({ where: { id: itemId }, data: { minQty } })
    const sum = await prisma.stockMovement.aggregate({ where: { itemId }, _sum: { delta: true } })
    const current = sum._sum.delta ?? 0
    const session = await getSession()
    await prisma.stockMovement.create({
      data: {
        itemId,
        type: "count",
        delta: countedQty - current,
        countedQty,
        note: note.trim(),
        authorId: session ? Number(session.sub) : null,
      },
    })
  } catch (error) {
    console.error("Record Count Error:", error)
    return failed
  }

  revalidatePath("/stock")
  return { success: true }
}

// Sets the low-stock level for every visible stock item in a category (or
// all of them) in one go. By default only items with no level yet, so
// levels already set item by item aren't overwritten.
export async function setLowStockLevels(
  category: string,
  minQty: number,
  onlyUnset: boolean
): Promise<StockResult & { updated?: number }> {
  const { t, allowed, denied, failed } = await guard()
  if (!allowed) return denied

  if (!Number.isFinite(minQty) || minQty < 0) {
    return { success: false, error: t("Please enter a valid low-stock level.", "กรุณากรอกระดับแจ้งเตือนให้ถูกต้อง") }
  }
  if (category !== "All" && category !== "" && !(STOCK_CATEGORIES as readonly string[]).includes(category)) {
    return failed
  }

  try {
    const tracked = await prisma.stockMovement.findMany({ distinct: ["itemId"], select: { itemId: true } })
    const result = await prisma.stockItem.updateMany({
      where: {
        id: { in: tracked.map((m) => m.itemId) },
        category: category === "All" ? { not: HIDDEN_CATEGORY } : category,
        ...(onlyUnset ? { minQty: 0 } : {}),
      },
      data: { minQty },
    })
    revalidatePath("/stock")
    return { success: true, updated: result.count }
  } catch (error) {
    console.error("Set Low Stock Levels Error:", error)
    return failed
  }
}
