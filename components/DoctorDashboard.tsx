"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Users, Calendar, Video, FileText, Search, Clock, CheckCircle, Stethoscope, MessageCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DoctorDashboardProps { user: any; setCurrentPage: (page: string) => void; language: string; setJitsiRoom?: (r: string | null) => void }

export function DoctorDashboard({ user, setCurrentPage, language, setJitsiRoom }: DoctorDashboardProps) {
  const en = language === "en"
  const [searchTerm, setSearchTerm] = useState("")
  const [appointments, setAppointments] = useState<any[]>([])
  const [stats, setStats] = useState({ todayPatients: 0, totalAppts: 0, videoConsults: 0, records: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { setLoading(false); return }

        // Fetch all appointments (doctor sees all)
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true })

        const allAppts = appts || []
        setAppointments(allAppts)

        // Compute stats
        const today = new Date().toISOString().split('T')[0]
        const todayAppts = allAppts.filter(a => a.appointment_date?.startsWith(today))
        const videoAppts = allAppts.filter(a => a.teleconsult_room_id)

        // Count medical records
        const { count: recCount } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })

        setStats({
          todayPatients: todayAppts.length,
          totalAppts: allAppts.filter(a => a.status === 'scheduled').length,
          videoConsults: videoAppts.length,
          records: recCount || 0
        })
      } catch (err) {
        console.error('Failed to fetch doctor data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctorData()
  }, [])

  // Build patient list from today's appointments
  const todayStr = new Date().toISOString().split('T')[0]
  const patients = appointments
    .filter(a => a.status === 'scheduled' || a.status === 'completed')
    .slice(0, 10)
    .map(a => ({
      id: a.id,
      name: `Patient ${a.patient_id?.slice(0, 6) || '---'}`,
      condition: a.notes || (en ? 'Consultation' : 'परामर्श'),
      status: a.status === 'completed' ? 'completed' : (a.appointment_date?.startsWith(todayStr) ? 'waiting' : 'scheduled'),
      time: a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString(en ? 'en-IN' : 'hi-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      roomId: a.teleconsult_room_id,
    }))

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const statusColors: Record<string, string> = { waiting: "bg-amber-100 text-amber-700", scheduled: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" }

  const startConsultation = (roomId: string) => {
    if (setJitsiRoom && roomId) {
      setJitsiRoom(roomId)
      setCurrentPage("jitsi")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{en ? `Welcome, ${user?.name || "Doctor"}` : `स्वागत, ${user?.name || "डॉक्टर"}`}</h1>
          <p className="text-muted-foreground text-sm">{en ? "Manage your patients and consultations" : "अपने मरीजों और परामर्श का प्रबंधन करें"}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ icon: Users, label: en ? "Today's Patients" : "आज के मरीज", value: String(stats.todayPatients), color: "text-blue-600 bg-blue-50" },
            { icon: Calendar, label: en ? "Appointments" : "अपॉइंटमेंट", value: String(stats.totalAppts), color: "text-teal-600 bg-teal-50" },
            { icon: Video, label: en ? "Video Consults" : "वीडियो परामर्श", value: String(stats.videoConsults), color: "text-purple-600 bg-purple-50" },
            { icon: FileText, label: en ? "Records" : "रिकॉर्ड", value: String(stats.records), color: "text-amber-600 bg-amber-50" },
          ].map((s, i) => { const I = s.icon; return (
            <Card key={i} className="hover-lift"><CardContent className="p-4 text-center">
              <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}><I className="h-5 w-5" /></div>
              <p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          )})}
        </div>

        {/* Patient Queue */}
        <Card><CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center"><Stethoscope className="h-5 w-5 mr-2 text-teal-600" />{en ? "Patient Queue" : "मरीज कतार"}</CardTitle>
            <div className="relative"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input className="pl-8 h-8 text-sm border rounded-lg w-48" placeholder={en ? "Search patients..." : "मरीज खोजें..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {filtered.length > 0 ? (
              <div className="space-y-3">{filtered.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center font-semibold text-teal-700">{p.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" />{p.time}</span>
                    <Badge className={`text-xs ${statusColors[p.status]}`}>{p.status}</Badge>
                    {p.status === "waiting" && p.roomId && (
                      <Button size="sm" className="h-7 text-xs gradient-primary text-white" onClick={() => startConsultation(p.roomId)}>
                        <Video className="h-3 w-3 mr-1" />{en ? "Start" : "शुरू"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}</div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{en ? "No patients in queue" : "कतार में कोई मरीज नहीं"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ label: en ? "View Schedule" : "शेड्यूल देखें", icon: Calendar, page: "appointments" },
            { label: en ? "AI Assistant" : "AI सहायक", icon: MessageCircle, page: "ai-chat" },
            { label: en ? "Patient Records" : "मरीज रिकॉर्ड", icon: FileText, page: "records" },
            { label: en ? "Health Info" : "स्वास्थ्य जानकारी", icon: CheckCircle, page: "health-info" },
          ].map((a, i) => { const I = a.icon; return (
            <Button key={i} variant="outline" onClick={() => setCurrentPage(a.page)} className="h-auto py-3 flex-col hover-lift">
              <I className="h-5 w-5 mb-1" /><span className="text-xs">{a.label}</span>
            </Button>
          )})}
        </div>
      </div>
    </div>
  )
}
