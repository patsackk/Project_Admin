import type { ProjectOption } from "@/components/ProjectSelect"

// Shapes returned by /api/users and /api/clients, as the Clients pages use them.
export type UserSummary = {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  role: string
}

export type ClientRow = {
  id: number
  userId: number
  location: string
  projectId: number | null
  user: UserSummary | null
  project: ProjectOption | null
}
