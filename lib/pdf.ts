import type { Browser } from "puppeteer-core"

// Turns a document page (the client's /share link) into a PDF by printing it
// in headless Chrome — the same output as Print → "Save as PDF".
//
// On Vercel the browser is @sparticuz/chromium. It has no Times / Arial /
// Tahoma and no Thai font, so FONT_CSS below maps those names to bundled
// look-alikes (Tinos ≈ Times, Arimo ≈ Arial) with Sarabun for Thai text.
// Locally it uses the installed Google Chrome (or CHROME_PATH).

const LOCAL_CHROME: Record<string, string> = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  linux: "/usr/bin/google-chrome",
}

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH || LOCAL_CHROME[process.platform],
    headless: true,
  })
}

// Each font name is two faces: Latin from Tinos/Arimo, Thai from Sarabun.
const THAI = "U+0E00-0E7F, U+200B-200D, U+25CC"
const face = (family: string, latin: string, weight: number) => `
@font-face { font-family: "${family}"; font-weight: ${weight}; src: url(/fonts/pdf/${latin}-${weight}.woff2) format("woff2"); }
@font-face { font-family: "${family}"; font-weight: ${weight}; unicode-range: ${THAI};
  src: url(/fonts/pdf/Sarabun-${weight === 700 ? "Bold" : "Regular"}.ttf) format("truetype"); }`
const FAMILIES: [string, string][] = [
  ["Times New Roman", "tinos"],
  ["Times", "tinos"],
  ["Arial", "arimo"],
  ["Helvetica", "arimo"],
  ["Tahoma", "arimo"],
]
const FONT_CSS =
  FAMILIES.flatMap(([family, latin]) => [face(family, latin, 400), face(family, latin, 700)]).join("") +
  // Tailwind's font-sans is the system UI font, which a server doesn't have.
  `.sheet .font-sans { font-family: Arial, sans-serif !important; }`

export async function renderPdf(url: string): Promise<Buffer> {
  const browser = await launch()
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 })
    if (!response?.ok()) throw new Error(`PDF page returned ${response?.status()}`)
    await page.addStyleTag({ content: FONT_CSS })
    // Fonts only start loading once the page lays out with them, which may be
    // after the PDF is taken, so load every face up front.
    await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((font) => font.load().catch(() => null)))
      await document.fonts.ready
    })
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
