export type StockItem = {
  id: string
  name: string
  category: string
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export const stockItems: StockItem[] = [
  {
    id: "LUX-0001",
    name: "Premium Copper Wiring (100m)",
    category: "Electrical",
    status: "In Stock",
  },
  {
    id: "LUX-0002",
    name: "High-Pressure Water Pump X5",
    category: "WaterSup",
    status: "Low Stock",
  },
  {
    id: "LUX-0003",
    name: "Smart AC Thermostat Gen 3",
    category: "AirCon",
    status: "In Stock",
  },
  {
    id: "LUX-0004",
    name: "Industrial PVC Pipe Filter",
    category: "WaterSup",
    status: "Low Stock",
  },
  {
    id: "LUX-0005",
    name: "Heavy Duty Circuit Breaker",
    category: "Electrical",
    status: "Out of Stock",
  },
]
