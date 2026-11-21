// One-off move from the local database to the online (Neon) one used on
// Vercel, and of the photos in public/uploads to Vercel Blob.
//
//   1. Create the tables in the online database:
//        DATABASE_URL="<neon url>" npx prisma db push
//   2. Copy:
//        TARGET_DATABASE_URL="<online url>" \
//          node --env-file=.env --env-file=.env.vercel scripts/copy-to-cloud.mjs
//      (.env.vercel from `vercel env pull .env.vercel` holds the Blob credentials)
//
// Reads from DATABASE_URL in .env (the local database). Refuses to run if
// the online database already has users, so it can't copy twice.
import { readFile } from "fs/promises"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { put } from "@vercel/blob"

const target = process.env.TARGET_DATABASE_URL
if (!target) throw new Error("Set TARGET_DATABASE_URL to the online database")
// Blob credentials: BLOB_STORE_ID + VERCEL_OIDC_TOKEN (from `vercel env pull`)
// or BLOB_READ_WRITE_TOKEN. Without them the photos keep their /uploads paths
// (test runs only).
const movePhotos = !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN)
if (!movePhotos) console.warn("No Blob credentials — photos are NOT moved")

const from = new PrismaClient()
const to = new PrismaClient({ datasourceUrl: target })

// Parents before children, so every relation already exists when a row is copied.
const MODELS = [
  "user", "project", "worker", "client", "schedule", "contactForm", "permission",
  "statusUpdate", "history", "portfolioProject", "service", "heroSlide",
  "stockItem", "purchaseLine", "stockMovement", "quotation", "invoice",
]

// /uploads/... → Blob URL, uploading each file once.
const moved = new Map()
async function moveUpload(src) {
  if (!movePhotos || typeof src !== "string" || !src.startsWith("/uploads/")) return src
  if (!moved.has(src)) {
    const file = await readFile(path.join(process.cwd(), "public", src))
    const blob = await put(src.slice("/uploads/".length), file, { access: "public", allowOverwrite: true })
    moved.set(src, blob.url)
    console.log("  photo", src, "→", blob.url)
  }
  return moved.get(src)
}
const moveAll = (list) => Promise.all(list.map(moveUpload))

const PHOTO_FIELDS = {
  statusUpdate: async (r) => ({ ...r, photos: await moveAll(r.photos) }),
  portfolioProject: async (r) => ({ ...r, coverImage: await moveUpload(r.coverImage), gallery: await moveAll(r.gallery) }),
  service: async (r) => ({ ...r, coverImage: await moveUpload(r.coverImage), gallery: await moveAll(r.gallery) }),
  heroSlide: async (r) => ({ ...r, image: await moveUpload(r.image) }),
}

if ((await to.user.count()) > 0) throw new Error("The online database already has users — not copying again")

for (const model of MODELS) {
  let rows = await from[model].findMany({ orderBy: { id: "asc" } })
  if (PHOTO_FIELDS[model]) rows = await Promise.all(rows.map(PHOTO_FIELDS[model]))
  if (rows.length) await to[model].createMany({ data: rows })

  // Rows were copied with their ids, so move each id counter past them.
  const table = model[0].toUpperCase() + model.slice(1)
  await to.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
  )
  console.log(`${table}: ${rows.length}`)
}

await Promise.all([from.$disconnect(), to.$disconnect()])
console.log("Done.")
