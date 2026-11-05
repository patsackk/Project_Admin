"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

// Dark label that appears straight away when the mouse is over (or keyboard
// focus is on) an icon button. Same component on the admin and client sites.
// It's drawn on <body> with fixed positioning, so a scrolling table or card
// can't cut it off.
//   side:  "top" (default) or "bottom" — use bottom for buttons in the top bar
//   align: which edge of the button the label lines up with, so it never runs
//          off the screen — "right" (default, for buttons on the right),
//          "left" (buttons on the left edge) or "center"
export default function Tooltip({
  label,
  hint,
  side = "top",
  align = "right",
  children,
}: {
  label: string
  hint?: string
  side?: "top" | "bottom"
  align?: "left" | "center" | "right"
  children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const show = () => ref.current && setRect(ref.current.getBoundingClientRect())
  const hide = () => setRect(null)

  useEffect(() => {
    if (!rect) return
    window.addEventListener("scroll", hide, true)
    return () => window.removeEventListener("scroll", hide, true)
  }, [rect])

  const style: React.CSSProperties = { position: "fixed" }
  if (rect) {
    if (side === "top") {
      style.top = rect.top - 8
      style.transform = "translateY(-100%)"
    } else {
      style.top = rect.bottom + 8
    }
    if (align === "right") style.right = window.innerWidth - rect.right
    else if (align === "left") style.left = rect.left
    else {
      style.left = rect.left + rect.width / 2
      style.transform = `${style.transform ?? ""} translateX(-50%)`
    }
  }

  return (
    <span
      ref={ref}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      // Clicking opens/does the thing — get the label out of the way.
      onMouseDown={hide}
      // Keyboard users get it on Tab; a mouse click's focus doesn't count.
      onFocus={(e) => (e.target as HTMLElement).matches(":focus-visible") && show()}
      onBlur={hide}
    >
      {children}
      {rect &&
        createPortal(
          <span
            role="tooltip"
            style={style}
            className="pointer-events-none z-[70] w-max max-w-[220px] rounded-lg bg-gray-900 px-2.5 py-1.5 text-left text-xs font-medium normal-case text-white shadow-lg"
          >
            {label}
            {hint && <span className="mt-0.5 block font-normal text-gray-300">{hint}</span>}
          </span>,
          document.body
        )}
    </span>
  )
}
