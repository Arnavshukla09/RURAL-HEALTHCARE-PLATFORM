"use client"
import { useEffect, useSyncExternalStore } from "react"

const initial = { fontSize: 16, highContrast: false, open: false, rate: 0.85 }
let state = initial
const listeners = new Set<() => void>()
let hydrated = false
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function setAccessibility(change: Partial<typeof initial>) {
  state = { ...state, ...change, fontSize: Math.max(12, Math.min(24, change.fontSize ?? state.fontSize)), rate: Math.max(0.5, Math.min(1.2, change.rate ?? state.rate)) }
  document.documentElement.style.fontSize = `${state.fontSize}px`
  document.documentElement.toggleAttribute("data-high-contrast", state.highContrast)
  try { localStorage.setItem("rhcp_accessibility_v1", JSON.stringify({ fontSize: state.fontSize, highContrast: state.highContrast, rate: state.rate })) } catch {}
  listeners.forEach(listener => listener())
  return state
}
export function getAccessibility() { return state }
export function useAccessibility() {
  const value = useSyncExternalStore(subscribe, () => state, () => initial)
  useEffect(() => {
    if (hydrated) return
    hydrated = true
    try {
      const saved = JSON.parse(localStorage.getItem("rhcp_accessibility_v1") || "null")
      if (saved) setAccessibility({ fontSize: typeof saved.fontSize === "number" && Number.isFinite(saved.fontSize) ? saved.fontSize : 16, highContrast: saved.highContrast === true, rate: typeof saved.rate === "number" && Number.isFinite(saved.rate) ? saved.rate : 0.85 })
    } catch {}
  }, [])
  return value
}
export function requestPageReading() { window.dispatchEvent(new Event("rhcp:read-page")) }
export function requestAudioStop() { window.dispatchEvent(new Event("rhcp:stop-audio")) }
