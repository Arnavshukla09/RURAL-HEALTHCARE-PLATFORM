"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Calendar, Clock, Video, CheckCircle, XCircle, User, Stethoscope, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AppointmentManagerProps { user: any; language: string; setCurrentPage: (page: string) => void; setJitsiRoom?: (r: string | null) => void }

export function AppointmentManager({ user, language, setCurrentPage, setJitsiRoom }: AppointmentManagerProps) {
  const en = language === "en"
  const isDoctor = user?.role === "doctor"
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [bookingForm, setBookingForm] = useState({ provider_id: "", date: "", time: "", notes: "" })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState("")

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/appointments")
        if (res.ok) {
          const data = await res.json()
          setAppointments(data || [])
        }
      } catch (err) {
        console.error("Failed to fetch appointments:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [bookingSuccess])

  // Fetch providers for booking form
  useEffect(() => {
    if (showBooking) {
      const fetchProviders = async () => {
        try {
          const supabase = createClient()
          const { data } = await supabase.from("healthcare_providers").select("*").eq("is_verified", true)
          setProviders(data || [])
        } catch (err) {
          console.error("Failed to fetch providers:", err)
        }
      }
      fetchProviders()
    }
  }, [showBooking])

  const upcoming = appointments.filter(a => a.status === "scheduled")
  const past = appointments.filter(a => a.status === "completed" || a.status === "cancelled")
  const display = activeTab === "upcoming" ? upcoming : past
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700"
  }

  const joinCall = (roomId: string) => {
    if (setJitsiRoom && roomId) {
      setJitsiRoom(roomId)
      setCurrentPage("jitsi")
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(en ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric" })
    } catch { return dateStr }
  }
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString(en ? "en-IN" : "hi-IN", { hour: "2-digit", minute: "2-digit" })
    } catch { return "" }
  }

  const handleBookAppointment = async () => {
    setBookingError("")
    setBookingSuccess("")

    if (!bookingForm.date || !bookingForm.time) {
      setBookingError(en ? "Please select date and time" : "कृपया तारीख और समय चुनें")
      return
    }

    setBookingLoading(true)
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setBookingError(en ? "Please login to book" : "बुक करने के लिए लॉगिन करें")
        setBookingLoading(false)
        return
      }

      // Ensure patient row exists via server API (bypasses RLS)
      let patientId: string | null = null
      try {
        const ensureRes = await fetch("/api/auth/ensure-patient", { method: "POST" })
        if (ensureRes.ok) {
          const ensureData = await ensureRes.json()
          patientId = ensureData.patient_id
        }
      } catch {}

      // Fallback: try direct DB read
      if (!patientId) {
        const { data: p } = await supabase.from('patients').select('id').eq('user_id', authUser.id).single()
        patientId = p?.id
      }

      // Get provider (seeded data is in healthcare_providers table)
      let provId = bookingForm.provider_id
      if (!provId) {
        const { data: providerList } = await supabase
          .from('healthcare_providers')
          .select('id')
          .eq('is_verified', true)
          .limit(1)
        provId = providerList?.[0]?.id
      }

      if (!patientId || !provId) {
        setBookingError(en ? "Unable to complete booking. Please try again." : "बुकिंग पूरी नहीं हो सकी। कृपया पुनः प्रयास करें।")
        setBookingLoading(false)
        return
      }

      const appointmentDate = new Date(`${bookingForm.date}T${bookingForm.time}:00`).toISOString()
      const roomId = `ruralhealth-${authUser.id.slice(0, 8)}-${Date.now()}`

      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        provider_id: provId,
        appointment_date: appointmentDate,
        duration_minutes: 30,
        status: 'scheduled',
        notes: bookingForm.notes || null,
        teleconsult_room_id: roomId,
      })

      if (error) {
        setBookingError(error.message)
      } else {
        setBookingSuccess(en ? "Appointment booked successfully!" : "अपॉइंटमेंट सफलतापूर्वक बुक हुई!")
        setBookingForm({ provider_id: "", date: "", time: "", notes: "" })
        setShowBooking(false)
      }
    } catch (err: any) {
      setBookingError(err?.message || "Failed to book")
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 to-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en ? "Appointments" : "अपॉइंटमेंट"}</h1>
          <p className="text-muted-foreground text-sm">{en ? "Manage your scheduled consultations" : "अपने शेड्यूल किए गए परामर्श प्रबंधित करें"}</p>
        </div>

        {/* Success/Error messages */}
        {bookingSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />{bookingSuccess}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          <Button variant={activeTab === "upcoming" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("upcoming")} className={activeTab === "upcoming" ? "gradient-primary text-white" : ""}>
            <Calendar className="h-4 w-4 mr-1.5" />{en ? "Upcoming" : "आगामी"} ({upcoming.length})
          </Button>
          <Button variant={activeTab === "past" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("past")} className={activeTab === "past" ? "gradient-primary text-white" : ""}>
            <CheckCircle className="h-4 w-4 mr-1.5" />{en ? "Past" : "पिछले"} ({past.length})
          </Button>
        </div>

        {/* Booking Form */}
        {showBooking && (
          <Card className="border-teal-200 bg-teal-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                {en ? "Book New Appointment" : "नया अपॉइंटमेंट बुक करें"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {providers.length > 0 && (
                <div>
                  <Label>{en ? "Select Doctor" : "डॉक्टर चुनें"}</Label>
                  <select
                    className="w-full border rounded-lg p-2.5 mt-1 bg-white text-sm focus:outline-none focus:border-teal-500"
                    value={bookingForm.provider_id}
                    onChange={e => setBookingForm(f => ({ ...f, provider_id: e.target.value }))}
                  >
                    <option value="">{en ? "-- Select a doctor --" : "-- डॉक्टर चुनें --"}</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.specialization} ({p.location})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{en ? "Date" : "तारीख"}</Label>
                  <Input type="date" value={bookingForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label>{en ? "Time" : "समय"}</Label>
                  <Input type="time" value={bookingForm.time}
                    onChange={e => setBookingForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>{en ? "Notes (optional)" : "नोट्स (वैकल्पिक)"}</Label>
                <Input placeholder={en ? "Describe your symptoms or reason for visit" : "अपने लक्षण या दौरे का कारण बताएं"}
                  value={bookingForm.notes}
                  onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {bookingError && <p className="text-red-600 text-sm">{bookingError}</p>}
              <div className="flex gap-2">
                <Button className="flex-1 gradient-primary text-white" onClick={handleBookAppointment} disabled={bookingLoading}>
                  {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  {en ? "Confirm Booking" : "बुकिंग कन्फर्म करें"}
                </Button>
                <Button variant="outline" onClick={() => { setShowBooking(false); setBookingError("") }}>
                  {en ? "Cancel" : "रद्द करें"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments List */}
        <div className="space-y-3">
          {display.map(a => (
            <Card key={a.id} className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mt-0.5">
                      {isDoctor ? <User className="h-5 w-5 text-teal-700" /> : <Stethoscope className="h-5 w-5 text-teal-700" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{en ? "Consultation" : "परामर्श"}</p>
                      <p className="text-xs text-muted-foreground">{a.notes ? a.notes.substring(0, 60) + (a.notes.length > 60 ? '...' : '') : (en ? 'No notes' : 'कोई नोट नहीं')}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{formatDate(a.appointment_date)}</span>
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{formatTime(a.appointment_date)}</span>
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{a.duration_minutes || 30} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs ${statusColors[a.status] || 'bg-gray-100'}`}>{a.status}</Badge>
                    {a.status === "scheduled" && a.teleconsult_room_id && (
                      <Button size="sm" className="h-7 text-xs gradient-primary text-white" onClick={() => joinCall(a.teleconsult_room_id)}>
                        <Video className="h-3 w-3 mr-1" />{en ? "Join" : "जुड़ें"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {display.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>{en ? "No appointments found" : "कोई अपॉइंटमेंट नहीं"}</p>
            </div>
          )}
        </div>

        {!isDoctor && (
          <Button className="w-full gradient-primary text-white" onClick={() => setShowBooking(!showBooking)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {en ? "Book New Appointment" : "नया अपॉइंटमेंट बुक करें"}
          </Button>
        )}
      </div>
    </div>
  )
}
