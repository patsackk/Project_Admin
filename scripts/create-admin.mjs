// Creates (or promotes) an admin account. There is no public sign-up for
// admin accounts on purpose — the dashboard is internal, so new admins are
// added here by whoever already has shell access to the server/database.
//
// Usage:
//   node scripts/create-admin.mjs "Full Name" admin@example.com "a-strong-password"

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const [name, email, password] = process.argv.slice(2)

if (!name || !email || !password) {
  console.error('Usage: node scripts/create-admin.mjs "Full Name" email@example.com "password"')
  process.exit(1)
}

const prisma = new PrismaClient()

try {
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", password: hashedPassword, name },
    create: { name, email, password: hashedPassword, role: "admin" },
    select: { id: true, name: true, email: true, role: true },
  })

  console.log("Admin account ready:", user)
} finally {
  await prisma.$disconnect()
}
