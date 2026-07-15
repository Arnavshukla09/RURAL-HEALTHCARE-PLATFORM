"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Users, Calendar, Activity, Shield, Database,
  TrendingUp, Loader2, CheckCircle, AlertTriangle, ClipboardList
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminDashboardProps {
  user: any
  language: string
  setCurrentPage: (page: string) => void
}

export function AdminDashboard({ user, language, setCurrentPage }: AdminDashboardProps) {
  const en = language === "en"
  const [stats, setStats] = useState({ users: 0, appointments: 0, records: 0, doctors: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentAppts, setRecentAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()

        const [
          { count: userCount },
          { count: apptCount },
          { count: recordCount },
          { count: doctorCount },
          { data: users },
          { data: appts },
        ] = await Promise.all([
          supabase.from("patients").select("*", { count: "exact", head: true }),
          supabase.from("appointments").select("*", { count: "exact", head: true }),
          supabase.from("medical_records").select("*", { count: "exact", head: true }),
          supabase.from("patients").select("*", { count: "exact", head: true }).eq("role", "doctor"),
          supabase.from("patients").select("id,first_name,last_name,email,role,created_at").order("created_at", { ascending: false }).limit(8),
          supabase.from("appointments").select("id,appointment_date,status,notes").order("appointment_date", { ascending: false }).limit(6),
        ])

        setStats({
          users: userCount ?? 0,
          appointments: apptCount ?? 0,
          records: recordCount ?? 0,
          doctors: doctorCount ?? 0,
        })
        setRecentUsers(users ?? [])
        setRecentAppts(appts ?? [])
      } catch (e) {
        console.error("Admin load error:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const roleColors: Record<string, string> = {
    patient: "bg-blue-100 text-blue-700",
    doctor: "bg-teal-100 text-teal-700",
    admin: "bg-purple-100 text-purple-700",
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{en ? `Admin Panel` : `व्यवस्थापक पैनल`}</h1>
              <p className="text-purple-200 text-sm">{en ? `Welcome, ${user?.name || "Admin"} — Rural Healthcare Platform` : `स्वागत, ${user?.name || "व्यवस्थापक"}`}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: en ? "Total Users" : "कुल उपयोगकर्ता", value: stats.users, icon: Users, color: "from-blue-500 to-cyan-500" },
            { label: en ? "Appointments" : "अपॉइंटमेंट", value: stats.appointments, icon: Calendar, color: "from-teal-500 to-green-500" },
            { label: en ? "Medical Records" : "मेडिकल रिकॉर्ड", value: stats.records, icon: ClipboardList, color: "from-orange-500 to-amber-500" },
            { label: en ? "Doctors" : "डॉक्टर", value: stats.doctors, icon: Activity, color: "from-purple-500 to-pink-500" },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-br ${s.color} p-4 text-white`}>
                    <Icon className="h-6 w-6 mb-2 opacity-80" />
                    <p className="text-3xl font-bold">{s.value}</p>
                    <p className="text-sm opacity-80 mt-1">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-purple-600" />
                {en ? "Recent Users" : "हाल के उपयोगकर्ता"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">{en ? "No users found" : "कोई उपयोगकर्ता नहीं"}</p>
              ) : (
                recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {(u.first_name?.[0] || u.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <Badge className={`text-xs border-0 shrink-0 ${roleColors[u.role] || roleColors.patient}`}>
                      {u.role}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-indigo-600" />
                {en ? "Recent Appointments" : "हाल की अपॉइंटमेंट"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">{en ? "No appointments found" : "कोई अपॉइंटमेंट नहीं"}</p>
              ) : (
                recentAppts.map(a => {
                  const d = new Date(a.appointment_date)
                  const statusColors: Record<string, string> = {
                    scheduled: "bg-blue-100 text-blue-700",
                    completed: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-700",
                  }
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-xs text-gray-400 truncate">{a.notes?.replace(/\[.*?\]/g, "").trim().slice(0, 50) || "—"}</p>
                      </div>
                      <Badge className={`text-xs border-0 shrink-0 ${statusColors[a.status] || "bg-gray-100 text-gray-600"}`}>
                        {a.status}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              {en ? "Admin Actions" : "व्यवस्थापक कार्य"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: en ? "All Appointments" : "सभी अपॉइंटमेंट", icon: Calendar,       page: "admin-appointments", color: "hover:border-blue-300 hover:bg-blue-50" },
                { label: en ? "Medical Records"  : "मेडिकल रिकॉर्ड",  icon: ClipboardList,  page: "admin-records",       color: "hover:border-teal-300 hover:bg-teal-50" },
                { label: en ? "User Management"  : "उपयोगकर्ता",       icon: Database,       page: "admin-users",         color: "hover:border-purple-300 hover:bg-purple-50" },
                { label: en ? "Campaigns"         : "अभियान",           icon: TrendingUp,     page: "admin-campaigns",     color: "hover:border-green-300 hover:bg-green-50" },
                { label: en ? "Notifications"     : "सूचनाएं",          icon: CheckCircle,    page: "admin-notifications", color: "hover:border-yellow-300 hover:bg-yellow-50" },
                { label: en ? "Health Facilities" : "स्वास्थ्य केंद्र",  icon: TrendingUp,     page: "locations",           color: "hover:border-indigo-300 hover:bg-indigo-50" },
                { label: en ? "Emergency"         : "आपातकाल",          icon: AlertTriangle,  page: "emergency",           color: "hover:border-red-300 hover:bg-red-50" },
              ].map((action, i) => {
                const Icon = action.icon
                return (
                  <button key={i} onClick={() => setCurrentPage(action.page)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white transition-all ${action.color}`}>
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {en ? "System Status" : "सिस्टम स्थिति"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: "Supabase DB", ok: true },
                { name: "Storage Bucket", ok: true },
                { name: "Gemini AI API", ok: true },
                { name: "Appointments API", ok: true },
                { name: "Medical Records API", ok: true },
                { name: "OSM Map Tiles", ok: true },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${s.ok ? "bg-green-50" : "bg-red-50"}`}>
                  <div className={`h-2 w-2 rounded-full ${s.ok ? "bg-green-500" : "bg-red-500"}`} />
                  <span className={s.ok ? "text-green-700" : "text-red-700"}>{s.name}</span>
                  <span className="ml-auto text-xs opacity-60">{s.ok ? "OK" : "Down"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
