"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ScrollableFilterRowProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function ScrollableFilterRow({
  children,
  className = "",
  contentClassName = "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth",
}: ScrollableFilterRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = containerRef.current
    if (!el) return

    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)

    const timeout = setTimeout(checkScroll, 120)

    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
      clearTimeout(timeout)
    }
  }, [checkScroll, children])

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current
    if (!el) return
    const offset = direction === "left" ? -220 : 220
    el.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <div className={`relative flex items-center group w-full min-w-0 max-w-full overflow-hidden ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left for previous options"
          className="absolute left-0 z-20 flex items-center justify-center h-7 w-7 rounded-full bg-white/95 border border-gray-300 shadow-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-hidden transition-all duration-150 -translate-x-1"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        </button>
      )}

      <div
        ref={containerRef}
        className={`w-full min-w-0 max-w-full ${contentClassName}`}
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right for more options"
          className="absolute right-0 z-20 flex items-center justify-center h-7 w-7 rounded-full bg-white/95 border border-blue-400 shadow-md text-blue-700 hover:bg-blue-50 focus:outline-hidden transition-all duration-150 translate-x-1 animate-pulse hover:animate-none"
        >
          <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  )
}
