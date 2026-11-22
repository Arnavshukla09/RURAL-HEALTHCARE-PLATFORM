"use client"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApp } from "@/components/providers/AppProvider"
import { consultationJoinPath } from "@/components/consultation-portal/booking-client"
import { Loader2, Calendar, ShieldCheck } from "lucide-react"

function AppointmentReview() {
  const { user, loading, language } = useApp()
  const router = useRouter()
  const appointmentId = useSearchParams().get("appointmentId")
  const en = language === "en"
  const destination = user?.role === "doctor" ? "/doctor/requests" : "/appointments"
  return <div className="min-h-screen flex items-center justify-center p-4 bg-teal-50"><Card className="max-w-md w-full"><CardContent className="p-6 space-y-4 text-center">
    {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : <ShieldCheck className="h-8 w-8 text-teal-600 mx-auto" />}
    <h1 className="font-bold text-xl">{en ? "Review your appointment" : "अपनी अपॉइंटमेंट की समीक्षा करें"}</h1>
    <p className="text-sm text-slate-600">{en ? "Sign in with your account to review appointment details and make confirmed changes." : "अपॉइंटमेंट विवरण और पुष्टि किए गए बदलाव के लिए अपने खाते में लॉगिन करें।"}</p>
    {!loading && <Button className="w-full" onClick={() => router.push(user ? destination : "/login?redirect=/appointments")}><Calendar className="h-4 w-4 mr-2" />{user ? (en ? "Open appointments" : "अपॉइंटमेंट खोलें") : (en ? "Sign in" : "लॉगिन करें")}</Button>}
    {user && appointmentId && <Button variant="outline" className="w-full" onClick={() => router.push(consultationJoinPath(appointmentId, language))}>{en ? "Request consultation entry" : "परामर्श प्रवेश जांचें"}</Button>}
  </CardContent></Card></div>
}
export default function TeleconsultConfirmPage() {
  return <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto" />}><AppointmentReview /></Suspense>
}
