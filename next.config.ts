import type { NextConfig } from "next";

// Pages that can send a quotation / invoice by email. Sending prints the PDF
// in a bundled Chromium (lib/pdf.ts), so their server functions carry it.
const SEND_EMAIL_PAGES = ["/documents", "/documents/**/*"]
const CHROMIUM_FILES = ["./node_modules/@sparticuz/chromium/bin/**"]

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: Object.fromEntries(SEND_EMAIL_PAGES.map((page) => [page, CHROMIUM_FILES])),
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB request body, which a single phone
      // photo exceeds — the status form allows several photos at 10MB each.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
