"use client"
import { useEffect, useRef, useState } from "react"
import { useApp } from "@/components/providers/AppProvider"
import { getAssistantPrompt } from "@/lib/assistant/prompts"
import { FACILITY_WORDS } from "@/lib/assistant/facility-control-catalog"
import { resolveAssistantLanguage } from "@/lib/assistant/languages"
import type { Facility } from "../types"

const types: Facility["type"][] = ["hospital", "clinic", "doctors", "pharmacy", "health_post", "lab"]
interface Props { sorted: Facility[]; loading: boolean; userCoords: { lat: number; lng: number } | null; filter: string; handleFilterChange: (filter: Facility["type"] | "all") => void; setCurrentPage: (page: number) => void }
export function useFacilityVoice(props: Props) {
  const { language } = useApp()
  const current = useRef(props); current.current = props
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [requestedType, setRequestedType] = useState<string | null>(null)
  const nearest = (text = "") => {
    const words = FACILITY_WORDS[resolveAssistantLanguage(language)]
    const index = types.findIndex((type, i) => text.toLowerCase().includes(type) || text.includes(words[i]) || text.toLowerCase().includes(FACILITY_WORDS.en[i]))
    const type = /\bphc\b/i.test(text) ? "phc" : index >= 0 ? types[index] : "all"
    current.current.handleFilterChange(type === "phc" ? "all" : type); current.current.setCurrentPage(1)
    setRequestedType(type)
  }
  useEffect(() => {
    const onNearest = (event: Event) => nearest(String((event as CustomEvent).detail?.text || ""))
    const cancel = () => setRequestedType(null)
    window.addEventListener("rhcp:facility-nearest", onNearest)
    window.addEventListener("rhcp:task-replaced", cancel)
    const query = new URLSearchParams(location.search)
    const startup = query.get("voice") === "nearest" ? setTimeout(() => nearest(query.get("request") || ""), 0) : null
    return () => { if (startup) clearTimeout(startup); window.removeEventListener("rhcp:facility-nearest", onNearest); window.removeEventListener("rhcp:task-replaced", cancel) }
  // Read fresh handlers through the ref, and bind language vocabulary on locale changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])
  useEffect(() => {
    if (requestedType === null || props.loading || props.filter !== (requestedType === "phc" ? "all" : requestedType)) return
    const match = props.sorted.filter(item => Number.isFinite(item.distance_km) && (requestedType === "all" || (requestedType === "phc" ? /phc/i.test(item.tier || "") || /\bphc\b|primary health/i.test(item.name) : item.type === requestedType))).sort((a, b) => a.distance_km - b.distance_km)[0]
    setSelectedId(match?.id || null); setRequestedType(null)
    if (match) props.setCurrentPage(Math.floor(props.sorted.findIndex(item => item.id === match.id) / 10) + 1)
    const reply = match ? `${getAssistantPrompt(language, "nearest")}: ${match.name}. ${match.distance_km.toFixed(1)} km (${getAssistantPrompt(language, props.userCoords ? "gps" : "district")}).` : getAssistantPrompt(language, "serverUnavailable")
    window.dispatchEvent(new CustomEvent("rhcp:page-reply", { detail: { text: reply } }))
  }, [requestedType, props.sorted, props.loading, props.filter, props.userCoords, language])
  return { nearest, selectedId }
}
