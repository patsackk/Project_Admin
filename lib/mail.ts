import nodemailer from "nodemailer"

// Outgoing email over SMTP. Defaults suit a Gmail account with an App
// Password; set SMTP_HOST/SMTP_PORT for any other provider.
//
//   SMTP_USER=utoadvance@gmail.com
//   SMTP_PASS=<16-character Google App Password>
//   SMTP_FROM="UTO Advance Engineering <utoadvance@gmail.com>"   (optional)

export function mailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export type MailAttachment = { filename: string; content: Buffer; contentType?: string }

export async function sendMail({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: MailAttachment[]
}) {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) throw new Error("SMTP_USER / SMTP_PASS are not set")

  const port = Number(process.env.SMTP_PORT ?? 465)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `UTO Advance Engineering <${user}>`,
    to,
    subject,
    text,
    html,
    attachments,
  })
}
