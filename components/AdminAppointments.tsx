"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Calendar, Search, ChevronDown, ChevronUp, Loader2,
  CheckCircle, XCircle, Video, Phone, MessageSquare, Users
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminAppointmentsProps { language: string }

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-orange-100 text-orange-700",
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
}

export function AdminAppointments({ language }: AdminAppointmentsProps) {
  const en = language === "en"
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(first_name, last_name, email, phone)")
        .order("appointment_date", { ascending: false })
      setAppointments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from("appointments").update({ status }).eq("id", id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setUpdating(null)
  }

  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === "all" ? true : a.status === statusFilter
    const p = Array.isArray(a.patients) ? a.patients[0] : a.patients
    const matchSearch = search
      ? [p?.first_name, p?.last_name, p?.email, a.notes].join(" ").toLowerCase().includes(search.toLowerCase())
      : true
    return matchStatus && matchSearch
  })

  const consultIcon = (notes: string) => {
    if (!notes) return MessageSquare
    if (notes.includes("VIDEO")) return Video
    if (notes.includes("AUDIO")) return Phone
    return MessageSquare
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  const counts = {
    all: appointments.length,
    scheduled: appointments.filter(a => a.status === "scheduled").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">{en ? "All Appointments" : "सभी अपॉइंटमेंट"}</h1>
            <p className="text-sm text-gray-500">{counts.all} {en ? "total" : "कुल"} · {counts.scheduled} {en ? "pending" : "लंबित"}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">{counts.scheduled} scheduled</span>
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">{counts.completed} done</span>
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">{counts.cancelled} cancelled</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={en ? "Search by patient name, email, notes..." : "नाम, ईमेल, नोट से खोजें..."}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-400" />
          </div>
          <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1">
            {["all","scheduled","completed","cancelled"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{en ? "No appointments found" : "कोई अपॉइंटमेंट नहीं"}</p>
            </CardContent></Card>
          ) : filtered.map(appt => {
            const p = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
            const patientName = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "Unknown"
            const d = new Date(appt.appointment_date)
            const Icon = consultIcon(appt.notes || "")
            const isExpanded = expanded === appt.id
            return (
              <Card key={appt.id} className={`overflow-hidden hover:shadow-md transition-shadow border-l-4 ${
                appt.status === "scheduled" ? "border-l-orange-400" :
                appt.status === "completed" ? "border-l-green-400" : "border-l-red-400"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {patientName[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-gray-900">{patientName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <Icon className="h-3 w-3 inline mr-0.5" />{appt.notes?.includes("VIDEO") ? "Video" : appt.notes?.includes("AUDIO") ? "Audio" : "Chat"}
                          </span>
                          <Badge className={`text-xs border-0 ${STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"}`}>{appt.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
                          {" at "}
                          {d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                        </p>
                        {p?.email && <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : appt.id)} className="text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {appt.notes && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{appt.notes}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {appt.status === "scheduled" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                              disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "completed")}>
                              {updating === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              {en ? "Mark Completed" : "पूर्ण करें"}
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 h-7 text-xs"
                              disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "cancelled")}>
                              <XCircle className="h-3 w-3 mr-1" />{en ? "Cancel" : "रद्द"}
                            </Button>
                          </>
                        )}
                        {appt.status !== "scheduled" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "scheduled")}>
                            {en ? "Re-open" : "पुनः खोलें"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
