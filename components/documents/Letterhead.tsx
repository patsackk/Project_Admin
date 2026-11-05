import { COMPANY } from "@/lib/documents"

// Company letterhead: logo and name on the left, contact details on the
// right, double rule underneath — as on the company's paper documents.
export function Letterhead() {
  return (
    <header className="mb-3">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-2">
          {/* Plain <img>: prints reliably, no optimisation needed for one logo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo_noname.png" alt="" className="h-[62px] w-auto" />
          <div className="leading-tight" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
            <p className="text-[15px] font-bold">UTO</p>
            <p className="text-[15px] font-bold">ADVANCE</p>
            <p className="border-b-2 border-[#1e3a5f] text-[15px] font-bold">ENGINEERING</p>
            <p className="text-[10px]">{COMPANY.nameTh}</p>
          </div>
        </div>
        <div className="text-right text-[15px] font-bold leading-tight">
          {COMPANY.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>Tel : {COMPANY.phone}</p>
          <p className="text-[11px] font-normal text-[#1e3a5f] underline" style={{ fontFamily: "Arial, sans-serif" }}>
            Email.{COMPANY.email}
          </p>
        </div>
      </div>
      <div className="mt-2 border-t-4 border-double border-black" />
    </header>
  )
}

// Smaller letterhead for the detail (BOQ) pages.
export function CompactLetterhead() {
  return (
    <header className="mb-2 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo_noname.png" alt="" className="h-[44px] w-auto" />
      <div className="leading-tight">
        <p className="text-[13px] font-bold underline">{COMPANY.nameEn}</p>
        <p className="text-[10px] font-bold text-[#1e3a5f]">{COMPANY.nameTh}</p>
        <p className="text-[10px]">{COMPANY.addressLines.join(" ")}</p>
        <p className="text-[10px]">
          Tel: {COMPANY.phone} Email: {COMPANY.email}
        </p>
      </div>
    </header>
  )
}
