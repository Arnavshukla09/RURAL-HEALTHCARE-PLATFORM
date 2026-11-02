"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { WifiOff, Phone, Stethoscope, AlertTriangle, RefreshCw, ShieldAlert, HeartPulse } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  const [lang, setLang] = useState<"en" | "hi">("en")
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rhcp_language")
      if (saved === "hi") setLang("hi")
    } catch {
      // ignore in incognito / restricted storage
    }
  }, [])

  const en = lang === "en"

  const handleRetry = () => {
    setIsRetrying(true)
    window.location.reload()
  }

  const emergencyContacts = [
    { number: "108", titleEn: "Ambulance & Medical Emergency", titleHi: "एम्बुलेंस और चिकित्सा आपातकाल", descEn: "Free 24/7 Government Emergency Medical Service", descHi: "निःशुल्क 24/7 सरकारी आपातकालीन चिकित्सा सेवा", color: "bg-red-600 text-white hover:bg-red-700" },
    { number: "112", titleEn: "All-in-One Emergency Response", titleHi: "अखिल भारतीय आपातकालीन नंबर", descEn: "Police, Fire and Medical assistance", descHi: "पुलिस, अग्निशमन और चिकित्सा सहायता", color: "bg-orange-600 text-white hover:bg-orange-700" },
    { number: "14416", titleEn: "Tele-MANAS Mental Health", titleHi: "टेली-मानस मानसिक स्वास्थ्य सेवा", descEn: "24/7 toll-free mental health support helpline", descHi: "24/7 निःशुल्क मानसिक स्वास्थ्य परामर्श हेल्पलाइन", color: "bg-teal-700 text-white hover:bg-teal-800" },
    { number: "104", titleEn: "Health Information Helpline", titleHi: "स्वास्थ्य सूचना एवं परामर्श हेल्पलाइन", descEn: "State healthcare advice and directory", descHi: "राज्य स्वास्थ्य सलाह और मार्गदर्शन", color: "bg-blue-600 text-white hover:bg-blue-700" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header / Language switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-teal-600" />
            <span className="font-bold text-gray-900 text-lg">RuralHealth</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(l => (l === "en" ? "hi" : "en"))}
            className="text-xs font-medium"
          >
            {en ? "हिन्दी में देखें" : "Switch to English"}
          </Button>
        </div>

        {/* Offline Banner Card */}
        <Card className="border-amber-200 bg-amber-50/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                <WifiOff className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {en ? "You Are Currently Offline" : "आप वर्तमान में ऑफ़लाइन हैं"}
                </h1>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {en
                    ? "Internet connectivity seems disrupted or unavailable in your area. Don't worry — emergency hotlines and pre-cached healthcare guides remain functional."
                    : "आपके क्षेत्र में इंटरनेट कनेक्शन बाधित या अनुपलब्ध प्रतीत होता है। चिंता न करें — आपातकालीन हेल्पलाइन और पहले से सहेजे गए स्वास्थ्य मार्गदर्शन काम कर रहे हैं।"}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="gradient-primary text-white text-xs h-8"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRetrying ? "animate-spin" : ""}`} />
                    {en ? "Check Connection & Reload" : "कनेक्शन जांचें और पुनः लोड करें"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direct Emergency Dials */}
        <Card className="shadow-md border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-100 pb-3">
            <CardTitle className="text-base text-red-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              {en ? "Emergency Hotlines (One-Tap Dial)" : "आपातकालीन हेल्पलाइन (एक-टैप डायल)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900 group-hover:text-red-700">
                      {en ? contact.titleEn : contact.titleHi}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {en ? contact.descEn : contact.descHi}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-sm flex-shrink-0 ${contact.color}`}>
                  <Phone className="h-3.5 w-3.5" />
                  <span>{contact.number}</span>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Offline Available Features */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-900 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              {en ? "Features Available Without Internet" : "बिना इंटरनेट उपलब्ध सुविधाएं"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link
              href="/symptom-checker"
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-700">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {en ? "Offline Symptom Checker & First-Aid" : "ऑफ़लाइन लक्षण जांचकर्ता एवं प्राथमिक चिकित्सा"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {en
                    ? "Access built-in triage rules, fever management, and home remedies without network."
                    : "बिना नेटवर्क के अंतर्निहित प्राथमिक उपचार, बुखार प्रबंधन और घरेलू उपचार देखें।"}
                </p>
              </div>
            </Link>

            <Link
              href="/emergency"
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {en ? "Emergency First-Aid Guide" : "आपातकालीन प्राथमिक चिकित्सा गाइड"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {en
                    ? "Step-by-step instructions for snakebite, burns, fractures, CPR, and severe bleeding."
                    : "सर्पदंश, जलने, फ्रैक्चर, सीपीआर और रक्तस्राव के लिए सचित्र चरण-दर-चरण निर्देश।"}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400">
          {en
            ? "Your queued consultations and appointments will sync automatically as soon as internet connection is restored."
            : "इंटरनेट कनेक्शन बहाल होते ही आपके लंबित अपॉइंटमेंट स्वचालित रूप से सिंक हो जाएंगे।"}
        </p>

      </div>
    </div>
  )
}
