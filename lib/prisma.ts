import { PrismaClient } from "@prisma/client"

// Password hashes are left out of every query by default, so a page or API
// route that loads a user (or a client with its user) can never send one to
// the browser. The login route asks for it explicitly with
// `omit: { password: false }`.
const createClient = () => new PrismaClient({ omit: { user: { password: true } } })

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createClient>
}

export const prisma =
  globalForPrisma.prisma || createClient()

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma
