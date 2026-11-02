/**
 * components/admin-campaign-manager/types.ts
 *
 * Types, constants, and utilities for AdminCampaignManager.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Campaigns Subsystem
 */

export interface AdminCampaignManagerProps {
  language: string
}

export interface Campaign {
  id?: string
  title: string
  description: string
  location: string
  address?: string
  start_date: string
  end_date: string
  start_time?: string
  status: "active" | "upcoming" | "ended"
  category: string
  participants?: number | null
  phone?: string
  map_url?: string
  is_annual?: boolean
  created_at?: string
}

export const CATEGORIES = [
  "vaccination",
  "tb_screening",
  "checkup",
  "awareness",
  "blood_donation",
  "eye_camp",
  "dental",
  "maternal",
  "other",
]

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  ended: "bg-gray-100 text-gray-500 border-gray-200",
}

export const emptyForm = (): Campaign => ({
  title: "",
  description: "",
  location: "",
  address: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  start_time: "10:00",
  status: "upcoming",
  category: "checkup",
  participants: undefined,
  phone: "",
  map_url: "",
  is_annual: false,
})

export const catLabel = (cat: string) => cat.replace(/_/g, " ")
