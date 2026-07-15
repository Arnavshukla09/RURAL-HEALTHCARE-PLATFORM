"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Users, FileText, CheckCircle, XCircle, Clock, Loader2, Search, ChevronDown, ChevronUp, Video, Phone, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DoctorAppointmentRequestsProps {
  language: string
  setCurrentPage: (page: string) => void
  setJitsiRoom?: (r: string | null) => void
}

export function DoctorAppointmentRequests({ language, setCurrentPage, setJitsiRoom }: DoctorAppointmentRequestsProps) {
  const en = language === "en"
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(first_name, last_name, email, phone)")
        .order("appointment_date", { ascending: true })
      setAppointments(data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const updateStatus = async (id: string, status: "scheduled" | "cancelled" | "completed") => {
    setUpdating(id)
    try {
      const supabase = createClient()
      await supabase.from("appointments").update({ status }).eq("id", id)
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } finally { setUpdating(null) }
  }

  // Supabase returns joined tables as arrays even for 1:1 relations
  const getPatient = (a: any) => Array.isArray(a.patients) ? a.patients[0] : a.patients

  const filtered = appointments.filter(a => {
    const p = getPatient(a)
    const matchTab = tab === "all" ? true : tab === "pending" ? a.status === "scheduled" : a.status === "completed"
    const matchSearch = search
      ? [p?.first_name, p?.last_name, p?.email, a.notes].join(" ").toLowerCase().includes(search.toLowerCase())
      : true
    return matchTab && matchSearch
  })

  const consultType = (notes: string) => {
    if (!notes) return { type: "chat", color: "bg-blue-100 text-blue-700", icon: MessageSquare }
    if (notes.includes("VIDEO")) return { type: "Video", color: "bg-purple-100 text-purple-700", icon: Video }
    if (notes.includes("AUDIO")) return { type: "Audio", color: "bg-green-100 text-green-700", icon: Phone }
    return { type: "Chat", color: "bg-blue-100 text-blue-700", icon: MessageSquare }
  }

  const statusColors: Record<string, string> = {
    scheduled: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-teal-900">{en ? "Appointment Requests" : "अपॉइंटमेंट अनुरोध"}</h1>
          <p className="text-sm text-gray-500">{en ? "Review and approve patient consultation requests" : "मरीज़ों के परामर्श अनुरोध समीक्षा करें"}</p>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-xl bg-white border border-gray-200 p-1 gap-1">
            {(["pending", "approved", "all"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {t === "pending" ? (en ? "Pending" : "लंबित") : t === "approved" ? (en ? "Completed" : "पूर्ण") : (en ? "All" : "सभी")}
                <span className="ml-1.5 text-xs opacity-75">
                  ({t === "pending" ? appointments.filter(a => a.status === "scheduled").length :
                    t === "approved" ? appointments.filter(a => a.status === "completed").length :
                    appointments.length})
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={en ? "Search by patient name or notes..." : "मरीज़ या नोट्स से खोजें..."}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400" />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{en ? "No appointments found" : "कोई अपॉइंटमेंट नहीं मिली"}</p>
              </CardContent>
            </Card>
          ) : filtered.map(appt => {
            const d = new Date(appt.appointment_date)
            const isExpanded = expanded === appt.id
            const ct = consultType(appt.notes || "")
            const Icon = ct.icon
            const p = getPatient(appt)
            const patientName = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unknown Patient"
            const isToday = d.toDateString() === new Date().toDateString()
            const isPast = d < new Date()

            return (
              <Card key={appt.id} className={`overflow-hidden transition-shadow hover:shadow-md ${
                appt.status === "scheduled" && !isPast ? "border-l-4 border-l-orange-400" :
                appt.status === "completed" ? "border-l-4 border-l-green-400" :
                appt.status === "cancelled" ? "border-l-4 border-l-red-400" : "border-l-4 border-l-gray-300"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {patientName[0]?.toUpperCase() || "P"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{patientName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ct.color}`}>
                            <Icon className="h-3 w-3 inline mr-1" />{ct.type}
                          </span>
                          {isToday && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Today</span>}
                          <Badge className={`text-xs border-0 ${statusColors[appt.status] || "bg-gray-100 text-gray-600"}`}>
                            {appt.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {d.toLocaleDateString(en ? "en-IN" : "hi-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          {" · "}
                          {d.toLocaleTimeString(en ? "en-IN" : "hi-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {p?.email && <p className="text-xs text-gray-400 mt-0.5">{p.email}</p>}
                      </div>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : appt.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {appt.notes && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">{en ? "Consultation Notes" : "नोट्स"}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{appt.notes}</p>
                        </div>
                      )}
                      {appt.teleconsult_room_id && (
                        <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-purple-700">{en ? "Video Room" : "वीडियो रूम"}</p>
                            <p className="text-xs text-purple-500 font-mono">{appt.teleconsult_room_id}</p>
                          </div>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                            onClick={() => { setJitsiRoom?.(appt.teleconsult_room_id); setCurrentPage("jitsi") }}>
                            <Video className="h-3 w-3 mr-1" />{en ? "Join Call" : "कॉल जॉइन"}
                          </Button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {appt.status === "scheduled" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs flex-1"
                              disabled={updating === appt.id}
                              onClick={() => updateStatus(appt.id, "completed")}>
                              {updating === appt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              {en ? "Mark Completed" : "पूर्ण करें"}
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs flex-1"
                              disabled={updating === appt.id}
                              onClick={() => updateStatus(appt.id, "cancelled")}>
                              <XCircle className="h-3 w-3 mr-1" />
                              {en ? "Cancel" : "रद्द करें"}
                            </Button>
                          </>
                        )}
                        {appt.status === "cancelled" && (
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                            disabled={updating === appt.id}
                            onClick={() => updateStatus(appt.id, "scheduled")}>
                            {en ? "Re-schedule" : "पुनः शेड्यूल"}
                          </Button>
                        )}
                        {appt.status === "completed" && (
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            {en ? "Consultation completed" : "परामर्श पूर्ण"}
                          </div>
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
