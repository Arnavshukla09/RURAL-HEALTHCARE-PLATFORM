"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Megaphone, Plus, Trash2, Edit3, Save, X, Loader2,
  Calendar, MapPin, CheckCircle, Phone, Users, Clock, ExternalLink, Navigation
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminCampaignManagerProps {
  language: string
}

interface Campaign {
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

const CATEGORIES = ["vaccination", "tb_screening", "checkup", "awareness", "blood_donation", "eye_camp", "dental", "maternal", "other"]
const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  ended:    "bg-gray-100 text-gray-500 border-gray-200",
}

const emptyForm = (): Campaign => ({
  title: "", description: "", location: "", address: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  start_time: "10:00",
  status: "upcoming", category: "checkup",
  participants: undefined, phone: "", map_url: "", is_annual: false,
})

export function AdminCampaignManager({ language }: AdminCampaignManagerProps) {
  const en = language === "en"
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Campaign>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("camps").select("*").order("start_date", { ascending: false })
    if (error) console.error("camps fetch error:", error)
    setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000) }

  const f = (k: keyof Campaign, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: form.title, description: form.description,
      location: form.location, address: form.address,
      start_date: form.start_date, end_date: form.end_date,
      start_time: form.start_time,
      status: form.status, category: form.category,
      participants: form.participants || null,
      phone: form.phone, map_url: form.map_url,
      is_annual: form.is_annual || false,
    }
    try {
      if (editing) {
        const { error } = await supabase.from("camps").update(payload).eq("id", editing)
        if (!error) {
          setCampaigns(prev => prev.map(c => c.id === editing ? ({ ...c, ...payload } as Campaign) : c))
          flash(en ? "Campaign updated!" : "अभियान अपडेट हुआ!")
        } else { flash("Error: " + error.message) }
      } else {
        const { data, error } = await supabase.from("camps").insert(payload).select().single()
        if (!error && data) {
          setCampaigns(prev => [data as Campaign, ...prev])
          flash(en ? "Campaign created!" : "अभियान बनाया गया!")
        } else { flash("Error: " + error?.message) }
      }
      setShowForm(false); setEditing(null); setForm(emptyForm())
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("camps").delete().eq("id", id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
    flash(en ? "Campaign deleted" : "अभियान हटाया गया")
  }

  const startEdit = (c: Campaign) => {
    setForm({ ...c })
    setEditing(c.id!)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const catLabel = (cat: string) => cat.replace(/_/g, " ")

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">{en ? "Campaign Manager" : "अभियान प्रबंधक"}</h1>
            <p className="text-sm text-gray-500">{campaigns.length} {en ? "campaigns" : "अभियान"}</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm()) }}>
            {showForm ? <><X className="h-4 w-4 mr-1" />{en ? "Cancel" : "रद्द"}</> : <><Plus className="h-4 w-4 mr-1" />{en ? "New Campaign" : "नया अभियान"}</>}
          </Button>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4" />{successMsg}
          </div>
        )}

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
              <CardTitle className="text-base">
                {editing ? (en ? "✏️ Edit Campaign" : "अभियान संपादित करें") : (en ? "➕ New Campaign" : "नया अभियान")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Title + Category */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Campaign Title *" : "अभियान शीर्षक *"}</label>
                  <input value={form.title} onChange={e => f("title", e.target.value)}
                    placeholder="RNTCP TB Screening Camp"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Category" : "श्रेणी"}</label>
                  <select value={form.category} onChange={e => f("category", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Description" : "विवरण"}</label>
                <textarea value={form.description} onChange={e => f("description", e.target.value)}
                  rows={3} placeholder="Free sputum test, chest X-ray, CBNAAT testing under Nikshay Poshan Yojana"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none" />
              </div>

              {/* Location + Address */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Venue Name *" : "स्थान नाम *"}</label>
                  <input value={form.location} onChange={e => f("location", e.target.value)}
                    placeholder="District TB Centre, Hamidia Hospital, Bhopal"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Address / Landmark" : "पता / लैंडमार्क"}</label>
                  <input value={form.address || ""} onChange={e => f("address", e.target.value)}
                    placeholder="Inside Hamidia Hospital Campus"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
              </div>

              {/* Dates + Time + Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Start Date" : "शुरू तिथि"}</label>
                  <input type="date" value={form.start_date} onChange={e => f("start_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Time" : "समय"}</label>
                  <input type="time" value={form.start_time || "10:00"} onChange={e => f("start_time", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "End Date" : "समाप्त तिथि"}</label>
                  <input type="date" value={form.end_date} onChange={e => f("end_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Status" : "स्थिति"}</label>
                  <select value={form.status} onChange={e => f("status", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              {/* Participants + Phone + Map */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Expected Participants" : "प्रतिभागी"}</label>
                  <input type="number" min={0} value={form.participants ?? ""} onChange={e => f("participants", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="90"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Contact Phone" : "संपर्क फ़ोन"}</label>
                  <input value={form.phone || ""} onChange={e => f("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Google Maps URL" : "मैप लिंक"}</label>
                  <input value={form.map_url || ""} onChange={e => f("map_url", e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
              </div>

              {/* Annual toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_annual || false} onChange={e => f("is_annual", e.target.checked)}
                  className="h-4 w-4 rounded accent-purple-600" />
                <span className="text-sm text-gray-700">{en ? "Annual recurring event" : "वार्षिक आयोजन"}</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  {editing ? (en ? "Save Changes" : "बदलाव सहेजें") : (en ? "Create Campaign" : "अभियान बनाएं")}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>
                  {en ? "Cancel" : "रद्द"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Campaign Cards ── */}
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                <Megaphone className="h-14 w-14 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-base">{en ? "No campaigns yet" : "अभी कोई अभियान नहीं"}</p>
                <p className="text-xs mt-1">{en ? "Click 'New Campaign' to add one" : "'नया अभियान' पर क्लिक करें"}</p>
              </CardContent>
            </Card>
          ) : campaigns.map(c => (
            <Card key={c.id} className={`overflow-hidden transition-all hover:shadow-lg ${deleteConfirm === c.id ? "ring-2 ring-red-400" : "border border-gray-100"}`}>
              {deleteConfirm === c.id ? (
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />{en ? `Delete "${c.title}"? This cannot be undone.` : `"${c.title}" हटाएं?`}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-red-600 text-white flex-1 h-8" onClick={() => handleDelete(c.id!)}>
                      {en ? "Yes, Delete" : "हां, हटाएं"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => setDeleteConfirm(null)}>
                      {en ? "Cancel" : "रद्द"}
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-0">
                  {/* Colour band */}
                  <div className={`h-1.5 w-full ${c.status === "active" ? "bg-green-500" : c.status === "upcoming" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <div className="p-5 space-y-3">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge className={`text-xs border capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{catLabel(c.category)}</Badge>
                          {c.is_annual && <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">Annual</Badge>}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{c.title}</h3>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => startEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c.id!)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
                    )}

                    {/* Details grid */}
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                        <div>
                          <p className="font-medium">{c.location}</p>
                          {c.address && <p className="text-xs text-gray-400">{c.address}</p>}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
                        <div>
                          <p className="font-medium">
                            {new Date(c.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {c.start_time && ` at ${c.start_time}`}
                          </p>
                          {c.is_annual && <p className="text-xs text-amber-600">Tentative — Annual</p>}
                          {c.end_date !== c.start_date && (
                            <p className="text-xs text-gray-400">
                              Until {new Date(c.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                      {c.participants && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4 flex-shrink-0 text-purple-500" />
                          <span>{c.participants} {en ? "participants" : "प्रतिभागी"}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4 flex-shrink-0 text-purple-500" />
                          <a href={`tel:${c.phone}`} className="hover:text-purple-700 hover:underline">{c.phone}</a>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                      {c.phone && (
                        <a href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors">
                          <Phone className="h-3 w-3" />{en ? "Call Camp" : "कॉल करें"}
                        </a>
                      )}
                      {c.map_url && (
                        <a href={c.map_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
                          <Navigation className="h-3 w-3" />{en ? "Get Directions" : "दिशा पाएं"}
                        </a>
                      )}
                      {c.map_url && (
                        <a href={c.map_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors">
                          <ExternalLink className="h-3 w-3" />{en ? "View on Map" : "मैप पर देखें"}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
