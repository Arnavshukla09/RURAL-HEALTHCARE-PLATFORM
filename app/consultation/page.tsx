"use client"

import { useApp } from "@/components/providers/AppProvider"
import { ConsultationPortal } from "@/components/ConsultationPortal"
import { Authentication } from "@/components/Authentication"
import { Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, symptomCheckResult, loading, setUser } = useApp()
  const router = useRouter()
  const en = language === "en"

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-8 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {en ? "Sign in to Book a Consultation" : "परामर्श बुक करने के लिए लॉगिन करें"}
          </h1>
          <p className="text-xs text-gray-500">
            {en
              ? "Teleconsultations, video calls, and appointment scheduling require a secure patient profile."
              : "टेलीपरामर्श, वीडियो कॉल और अपॉइंटमेंट शेड्यूल करने के लिए सुरक्षित प्रोफ़ाइल आवश्यक है।"}
          </p>
        </div>
        <Authentication
          setUser={setUser}
          setCurrentPage={(p) => router.push(p === "home" ? "/" : `/${p}`)}
          language={language}
        />
      </div>
    )
  }

  return <ConsultationPortal user={user} language={language} symptomResult={symptomCheckResult} />
}
