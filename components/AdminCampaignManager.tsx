"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Megaphone, Plus, Trash2, Edit3, Save, X, Loader2,
  Calendar, MapPin, CheckCircle, Eye, EyeOff
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
  start_date: string
  end_date: string
  status: "active" | "upcoming" | "ended"
  category: string
  created_at?: string
}

const CATEGORIES = ["vaccination", "checkup", "awareness", "blood_donation", "eye_camp", "other"]
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  upcoming: "bg-blue-100 text-blue-700",
  ended: "bg-gray-100 text-gray-600",
}

const emptyForm = (): Campaign => ({
  title: "", description: "", location: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "upcoming", category: "checkup"
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
    const { data } = await supabase.from("camps").select("*").order("start_date", { ascending: false })
    setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000) }

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim()) return
    setSaving(true)
    const supabase = createClient()
    try {
      if (editing) {
        const { error } = await supabase.from("camps").update({
          title: form.title, description: form.description,
          location: form.location, start_date: form.start_date,
          end_date: form.end_date, status: form.status, category: form.category,
        }).eq("id", editing)
        if (!error) {
          setCampaigns(prev => prev.map(c => c.id === editing ? { ...c, ...form } : c))
          flash(en ? "Campaign updated!" : "अभियान अपडेट हुआ!")
        }
      } else {
        const { data, error } = await supabase.from("camps").insert({
          title: form.title, description: form.description,
          location: form.location, start_date: form.start_date,
          end_date: form.end_date, status: form.status, category: form.category,
        }).select().single()
        if (!error && data) {
          setCampaigns(prev => [data as Campaign, ...prev])
          flash(en ? "Campaign created!" : "अभियान बनाया गया!")
        }
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
            <p className="text-sm text-gray-500">{en ? "Create and manage health camps and campaigns" : "स्वास्थ्य शिविर और अभियान बनाएं"}</p>
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

        {/* Form */}
        {showForm && (
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-purple-900">
                {editing ? (en ? "Edit Campaign" : "अभियान संपादित करें") : (en ? "Create New Campaign" : "नया अभियान बनाएं")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Campaign Title *" : "अभियान शीर्षक *"}</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={en ? "e.g. Free Eye Checkup Camp" : "जैसे: मुफ़्त नेत्र जांच शिविर"}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Location *" : "स्थान *"}</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder={en ? "e.g. PHC Kothri, Sehore" : "जैसे: PHC कोठरी, सीहोर"}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Description" : "विवरण"}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder={en ? "Details about this campaign..." : "अभियान का विवरण..."}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none" />
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Start Date" : "शुरू तिथि"}</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "End Date" : "समाप्त तिथि"}</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Category" : "श्रेणी"}</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{en ? "Status" : "स्थिति"}</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 bg-white">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
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

        {/* Campaign cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.length === 0 ? (
            <div className="col-span-2">
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{en ? "No campaigns yet" : "अभी कोई अभियान नहीं"}</p>
                  <p className="text-xs mt-1">{en ? "Click 'New Campaign' to create one" : "'नया अभियान' पर क्लिक करें"}</p>
                </CardContent>
              </Card>
            </div>
          ) : campaigns.map(c => (
            <Card key={c.id} className={`overflow-hidden hover:shadow-md transition-shadow ${deleteConfirm === c.id ? "ring-2 ring-red-400" : ""}`}>
              <CardContent className="p-4 space-y-3">
                {deleteConfirm === c.id ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700 font-medium">
                      {en ? `Delete "${c.title}"?` : `"${c.title}" हटाएं?`}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-red-600 text-white h-7 text-xs flex-1" onClick={() => handleDelete(c.id!)}>
                        {en ? "Yes, Delete" : "हां, हटाएं"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setDeleteConfirm(null)}>
                        {en ? "Cancel" : "रद्द"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={`text-xs border-0 capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{c.category?.replace("_", " ")}</Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 leading-tight">{c.title}</h3>
                      </div>
                    </div>
                    {c.description && <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />{c.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" → "}
                        {new Date(c.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => startEdit(c)}>
                        <Edit3 className="h-3 w-3 mr-1" />{en ? "Edit" : "संपादित"}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteConfirm(c.id!)}>
                        <Trash2 className="h-3 w-3 mr-1" />{en ? "Delete" : "हटाएं"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
