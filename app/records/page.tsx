"use client"

import { useApp } from "@/components/providers/AppProvider"
import { PatientRecords } from "@/components/PatientRecords"
import { Authentication } from "@/components/Authentication"
import { Loader2, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const { user, language, loading, setUser } = useApp()
  const router = useRouter()
  const en = language === "en"

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "doctor") {
        router.replace("/doctor/patients")
      } else if (user.role === "admin") {
        router.replace("/admin/records")
      }
    }
  }, [loading, user, router])

  if (loading || user?.role === "doctor" || user?.role === "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!user || user.id === "guest") {
    return (
      <div className="py-8 px-4 max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {en ? "Sign in to View Medical Records" : "चिकित्सा रिकॉर्ड देखने के लिए लॉगिन करें"}
          </h1>
          <p className="text-xs text-gray-500">
            {en
              ? "Your digital prescriptions, lab test reports, and vaccination history are encrypted and private to your account. Guest users cannot access clinical records."
              : "आपके डिजिटल नुस्खे, लैब रिपोर्ट और टीकाकरण इतिहास सुरक्षित और केवल आपके खाते में उपलब्ध हैं। अतिथि उपयोगकर्ताओं के लिए रिकॉर्ड उपलब्ध नहीं हैं।"}
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

  return <PatientRecords language={language} user={user} />
}
