// Shared stock helpers (used by the Stock page, its actions and the admin
// assistant).

// Stored in StockItem.category. "Office" items (stationery, kitchen, IT,
// fees...) are bought through the warehouse too but aren't site stock, so
// the Stock page hides them.
export const STOCK_CATEGORIES = ["Electrical", "WaterSup", "AirCon", "Tools", "Office"] as const
export const HIDDEN_CATEGORY = "Office"

export type StockStatus = "in" | "low" | "out"

export function stockStatus(onHand: number, minQty: number): StockStatus {
  if (onHand <= 0) return "out"
  if (onHand <= minQty) return "low"
  return "in"
}
