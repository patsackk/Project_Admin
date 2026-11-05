import { COMPANY } from "@/lib/documents"

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// A plain, table-based HTML email (what email apps render reliably): the
// message, a small summary card and a button to open the document.
export function documentEmailHtml({
  message,
  title,
  rows,
  link,
  buttonLabel,
}: {
  message: string
  title: string
  rows: [string, string][]
  link: string | null
  buttonLabel: string
}) {
  const paragraphs = message
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("")
  const summary = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${escape(k)}</td><td style="padding:4px 0;font-weight:600;color:#111827">${escape(v)}</td></tr>`
    )
    .join("")
  const button = link
    ? `<p style="margin:20px 0 6px"><a href="${escape(link)}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:999px">${escape(buttonLabel)}</a></p>
       <p style="margin:0;font-size:12px;color:#6b7280">Or copy this link: <a href="${escape(link)}" style="color:#0369a1">${escape(link)}</a></p>`
    : ""

  return `<!doctype html><html><body style="margin:0;background:#f0f9ff;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1f2937">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f9ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="background:#0c4a6e;padding:18px 24px;color:#ffffff;font-weight:700;font-size:16px">${escape(COMPANY.nameEn)}</td></tr>
<tr><td style="padding:24px">
${paragraphs}
<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px 16px;margin-top:6px">
<tr><td colspan="2" style="padding:0 0 6px;font-weight:700;color:#0c4a6e">${escape(title)}</td></tr>
${summary}
</table>
${button}
</td></tr>
<tr><td style="padding:14px 24px;background:#f9fafb;color:#6b7280;font-size:12px">${escape(COMPANY.addressLines.join(" "))} · Tel ${escape(COMPANY.phone)} · ${escape(COMPANY.email)}</td></tr>
</table></td></tr></table></body></html>`
}
