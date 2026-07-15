"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Stethoscope, Calendar, Clock, Video, User, CheckCircle,
  XCircle, Loader2, Phone, ClipboardList, Activity
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DoctorDashboardProps {
  user: any
  language: string
  setJitsiRoom?: (r: string | null) => void
}

export function DoctorDashboard({ user, language, setJitsiRoom }: DoctorDashboardProps) {
  const router = useRouter();
  const en = language === "en"
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, today: 0, completed: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/appointments")
        if (res.ok) {
          const data = await res.json()
          const arr: any[] = Array.isArray(data) ? data : (data.appointments ?? [])
          setAppointments(arr)
          const today = new Date().toDateString()
          setStats({
            total: arr.length,
            today: arr.filter(a => new Date(a.appointment_date).toDateString() === today).length,
            completed: arr.filter(a => a.status === "completed").length,
          })
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const joinCall = (roomId: string) => {
    if (setJitsiRoom && roomId) { setJitsiRoom(roomId); router.push("/appointments") }
  }

  const markDone = async (id: string) => {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "completed" } : a))
  }

  const upcoming = appointments.filter(a => a.status === "scheduled")
  const past = appointments.filter(a => a.status === "completed" || a.status === "cancelled")

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0] || "D"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{en ? `Welcome, ${user?.name || "Doctor"}` : `स्वागत, ${user?.name || "डॉक्टर"}`}</h1>
              <p className="text-teal-100 text-sm">{en ? "Doctor Portal — Rural Healthcare Platform" : "डॉक्टर पोर्टल — ग्रामीण स्वास्थ्य मंच"}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: en ? "Total Appointments" : "कुल अपॉइंटमेंट", value: stats.total, icon: Calendar, color: "text-blue-600 bg-blue-50" },
            { label: en ? "Today" : "आज", value: stats.today, icon: Clock, color: "text-orange-600 bg-orange-50" },
            { label: en ? "Completed" : "पूर्ण", value: stats.completed, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5 text-teal-600" />
                {en ? "Patient Queue" : "मरीज़ कतार"}
                <Badge variant="outline" className="ml-auto">{upcoming.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{en ? "No upcoming appointments" : "कोई आगामी अपॉइंटमेंट नहीं"}</p>
                </div>
              ) : (
                upcoming.map(appt => {
                  const d = new Date(appt.appointment_date)
                  const isToday = d.toDateString() === new Date().toDateString()
                  return (
                    <div key={appt.id} className={`rounded-xl border p-3 space-y-2 ${isToday ? "border-teal-200 bg-teal-50" : "border-gray-100 bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{appt.notes?.split("|")?.[0]?.replace(/\[.*?\]/g, "").trim() || "Patient"}</p>
                            <p className="text-xs text-gray-500">{d.toLocaleDateString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short" })} · {d.toLocaleTimeString(en ? "en-IN" : "hi-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        {isToday && <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">{en ? "Today" : "आज"}</Badge>}
                      </div>
                      {appt.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 line-clamp-2">{appt.notes}</p>}
                      <div className="flex gap-2">
                        {appt.teleconsult_room_id && (
                          <Button size="sm" className="flex-1 gradient-primary text-white h-7 text-xs" onClick={() => joinCall(appt.teleconsult_room_id)}>
                            <Video className="h-3 w-3 mr-1" />{en ? "Join Video" : "वीडियो जॉइन"}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-green-600 border-green-200" onClick={() => markDone(appt.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" />{en ? "Done" : "पूर्ण"}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Past / Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-gray-500" />
                {en ? "Completed Consultations" : "पूर्ण परामर्श"}
                <Badge variant="outline" className="ml-auto">{past.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {past.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{en ? "No completed consultations yet" : "अभी कोई पूर्ण परामर्श नहीं"}</p>
                </div>
              ) : (
                past.slice(0, 8).map(appt => {
                  const d = new Date(appt.appointment_date)
                  return (
                    <div key={appt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${appt.status === "completed" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {appt.status === "completed" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.toLocaleDateString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-xs text-gray-400 truncate">{appt.notes?.replace(/\[.*?\]/g, "").trim().slice(0, 50) || "—"}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${appt.status === "completed" ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}`}>
                        {appt.status}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">{en ? "Quick Actions" : "त्वरित कार्य"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: en ? "My Appointments" : "मेरी अपॉइंटमेंट", icon: Calendar, page: "appointments" },
                { label: en ? "Patient Records" : "मरीज़ रिकॉर्ड", icon: ClipboardList, page: "records" },
                { label: en ? "Find Hospitals" : "अस्पताल खोजें", icon: Stethoscope, page: "locations" },
                { label: en ? "Emergency" : "आपातकाल", icon: Phone, page: "emergency" },
              ].map((action, i) => {
                const Icon = action.icon
                return (
                  <button key={i} onClick={() => router.push(`/${action.page}`)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 transition-all text-center">
                    <Icon className="h-5 w-5 text-teal-600" />
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
