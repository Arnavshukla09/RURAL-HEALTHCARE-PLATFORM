"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Video, Phone, MessageCircle, Calendar, Clock, Loader2, CheckCircle, Stethoscope } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ConsultationPortalProps {
  language: string
  user?: any
  setCurrentPage?: (page: string) => void
}

const consultationTypes = [
  { id: "video", label: "Video Consultation", labelHi: "वीडियो परामर्श", icon: Video, desc: "Face-to-face video call with doctor", descHi: "डॉक्टर के साथ वीडियो कॉल" },
  { id: "audio", label: "Audio Consultation", labelHi: "ऑडियो परामर्श", icon: Phone, desc: "Voice call with doctor", descHi: "डॉक्टर के साथ वॉइस कॉल" },
  { id: "chat", label: "Chat Consultation", labelHi: "चैट परामर्श", icon: MessageCircle, desc: "Text chat with doctor", descHi: "डॉक्टर के साथ टेक्स्ट चैट" },
]

export function ConsultationPortal({ language, user, setCurrentPage }: ConsultationPortalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [providersLoaded, setProvidersLoaded] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const en = language === "en"

  // Fetch providers when user selects a consultation type
  const handleSelectType = async (typeId: string) => {
    setSelectedType(typeId)
    setSuccess("")
    setError("")
    if (!providersLoaded) {
      try {
        const supabase = createClient()
        const { data } = await supabase.from("healthcare_providers").select("*").eq("is_verified", true)
        setProviders(data || [])
        setProvidersLoaded(true)
      } catch (err) {
        console.error("Failed to fetch providers:", err)
      }
    }
  }

  const handleBook = async () => {
    if (!date || !time) {
      setError(en ? "Please select date and time" : "कृपया तारीख और समय चुनें")
      return
    }

    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError(en ? "Please login to book a consultation" : "परामर्श बुक करने के लिए लॉगिन करें")
        setLoading(false)
        return
      }

      // Get patient ID
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', authUser.id)
        .single()

      // Get provider ID (first available if none selected)
      let provId = selectedProvider
      if (!provId) {
        const { data: provList } = await supabase.from('providers').select('id').eq('is_verified', true).limit(1)
        provId = provList?.[0]?.id
      }

      if (!patient?.id || !provId) {
        setError(en ? "Account setup incomplete. Please contact support." : "खाता सेटअप अधूरा है।")
        setLoading(false)
        return
      }

      const appointmentDate = new Date(`${date}T${time}:00`).toISOString()
      const roomId = `ruralhealth-${authUser.id.slice(0, 8)}-${Date.now()}`

      const { error: dbError } = await supabase.from('appointments').insert({
        patient_id: patient.id,
        provider_id: provId,
        appointment_date: appointmentDate,
        duration_minutes: 30,
        status: 'scheduled',
        notes: notes || `${selectedType} consultation requested`,
        teleconsult_room_id: roomId,
      })

      if (dbError) {
        setError(dbError.message)
      } else {
        setSuccess(en ? "Consultation booked successfully! View it in your Appointments." : "परामर्श सफलतापूर्वक बुक हुआ! अपॉइंटमेंट में देखें।")
        setSelectedType(null)
        setDate("")
        setTime("")
        setNotes("")
        setSelectedProvider("")
      }
    } catch (err: any) {
      setError(err?.message || "Booking failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Stethoscope className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{en ? "Consultation Portal" : "परामर्श पोर्टल"}</h2>
        <p className="text-gray-500">{en ? "Connect with a Doctor — All consultations are free" : "डॉक्टर से जुड़ें — सभी परामर्श निःशुल्क"}</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
          <CheckCircle className="h-4 w-4" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      {/* Step 1: Select consultation type */}
      <div className="grid gap-3 mb-6">
        {consultationTypes.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedType === item.id
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-gray-200 hover:border-teal-300"
              }`}
              onClick={() => handleSelectType(item.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedType === item.id ? 'bg-teal-100' : 'bg-gray-100'}`}>
                  <Icon className={`h-5 w-5 ${selectedType === item.id ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{en ? item.label : item.labelHi}</p>
                  <p className="text-sm text-gray-500">{en ? item.desc : item.descHi}</p>
                </div>
                <span className="text-green-600 font-semibold text-sm bg-green-50 px-2 py-1 rounded">{en ? "Free" : "निःशुल्क"}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 2: Booking form (shown when type is selected) */}
      {selectedType && (
        <Card className="border-teal-200 bg-gradient-to-b from-teal-50/50 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              {en ? "Schedule Your Consultation" : "अपना परामर्श शेड्यूल करें"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.length > 0 && (
              <div>
                <Label>{en ? "Select Doctor" : "डॉक्टर चुनें"}</Label>
                <select
                  className="w-full border rounded-lg p-2.5 mt-1 bg-white text-sm focus:outline-none focus:border-teal-500"
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                >
                  <option value="">{en ? "-- Any available doctor --" : "-- कोई भी उपलब्ध डॉक्टर --"}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.specialization}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{en ? "Date" : "तारीख"}</Label>
                <Input type="date" value={date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{en ? "Time" : "समय"}</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{en ? "Describe your symptoms (optional)" : "अपने लक्षण बताएं (वैकल्पिक)"}</Label>
              <textarea
                className="w-full border rounded-lg p-3 mt-1 text-sm focus:outline-none focus:border-teal-500 min-h-[80px] resize-none"
                placeholder={en ? "E.g., Fever for 3 days, headache, body ache..." : "जैसे: 3 दिन से बुखार, सिरदर्द, बदन दर्द..."}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <Button className="w-full gradient-primary text-white" onClick={handleBook} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
              {en ? "Confirm Booking" : "बुकिंग कन्फर्म करें"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info text at bottom */}
      <p className="text-center text-xs text-gray-400 mt-6">
        {en
          ? "All consultations are conducted via Jitsi Meet (free & secure). No payment required."
          : "सभी परामर्श Jitsi Meet के माध्यम से होते हैं (मुफ्त और सुरक्षित)। कोई भुगतान आवश्यक नहीं।"}
      </p>
    </div>
  )
}
