"use client"

import { useState } from "react"
import Link from "next/link"
import { WifiOff, Phone, Stethoscope, AlertTriangle, RefreshCw, ShieldAlert, HeartPulse, Home } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApp } from "@/components/providers/AppProvider"
import { ASSISTANT_LANGUAGES, getAssistantLanguage } from "@/lib/assistant/languages"
import { getAssistantPrompt, type AssistantPromptKey } from "@/lib/assistant/prompts"

const EMERGENCY_CONTACTS: Array<{ number: string; key: AssistantPromptKey; color: string }> = [
  { number: "108", key: "emergencyCall", color: "bg-red-600 text-white" },
  { number: "112", key: "call112", color: "bg-orange-600 text-white" },
  { number: "14416", key: "mentalHealthCall", color: "bg-teal-700 text-white" },
  { number: "104", key: "stateHealthCall", color: "bg-blue-600 text-white" },
]

export default function OfflinePage() {
  const { language, setLanguage } = useApp()
  const [isRetrying, setIsRetrying] = useState(false)
  const selected = getAssistantLanguage(language)
  const t = (key: AssistantPromptKey) => getAssistantPrompt(language, key)

  return (
    <div className="notranslate min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8 sm:px-6" translate="no" dir={selected.dir}>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><HeartPulse className="h-6 w-6 text-teal-600" aria-hidden="true"/><span className="text-lg font-bold text-gray-900">RuralHealth</span></div>
          <select aria-label={t("chooseLanguage")} value={selected.code} onChange={event => setLanguage(event.target.value)} className="min-h-12 max-w-[50%] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900">
            {ASSISTANT_LANGUAGES.map(entry => <option key={entry.code} value={entry.code}>{entry.nativeName}</option>)}
          </select>
        </div>

        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <WifiOff className="h-10 w-10 shrink-0 text-amber-700" aria-hidden="true"/>
              <div className="space-y-3">
                <h1 className="text-xl font-bold text-gray-900">{t("offlineTitle")}</h1>
                <p className="text-sm leading-relaxed text-gray-700">{t("offlineGuidance")}</p>
                <Button onClick={() => { setIsRetrying(true); window.location.reload() }} disabled={isRetrying} className="min-h-12 gap-2 bg-teal-700 text-white hover:bg-teal-800">
                  <RefreshCw className={`h-5 w-5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true"/>{t("retryConnection")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 shadow-sm">
          <CardHeader className="border-b border-red-100 bg-red-50 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-900"><ShieldAlert className="h-6 w-6" aria-hidden="true"/>{t("emergency")}</CardTitle>
            <p className="text-sm leading-relaxed text-red-900">{t("offlineEmergencyNote")}</p>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {EMERGENCY_CONTACTS.map(contact => (
              <a key={contact.number} href={`tel:${contact.number}`} className={`flex min-h-16 items-center justify-between gap-3 rounded-xl px-4 py-3 font-semibold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${contact.color}`}>
                <span className="flex items-center gap-3"><Phone className="h-7 w-7 shrink-0" aria-hidden="true"/>{t(contact.key)}</span>
                <span className="text-xl font-bold" dir="ltr">{contact.number}</span>
              </a>
            ))}
            <p className="text-xs leading-relaxed text-gray-600">{t("offlineCallsNote")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base text-gray-900">{t("offlineSavedTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4">
            <Link href="/symptom-checker" className="flex min-h-16 items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 hover:bg-teal-100">
              <Stethoscope className="h-8 w-8 shrink-0 text-teal-700" aria-hidden="true"/><div><p className="font-semibold text-gray-900">{t("checkSymptoms")}</p><p className="mt-1 text-xs leading-relaxed text-gray-600">{t("offlineSymptomsNote")}</p></div>
            </Link>
            <Link href="/emergency" className="flex min-h-16 items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 font-semibold text-red-900 hover:bg-red-100"><AlertTriangle className="h-8 w-8 shrink-0" aria-hidden="true"/>{t("emergency")}</Link>
            <Link href="/" className="flex min-h-16 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 font-semibold text-gray-900 hover:bg-gray-100"><Home className="h-8 w-8 shrink-0 text-teal-700" aria-hidden="true"/>{t("home")}</Link>
            <p className="text-xs leading-relaxed text-gray-600">{t("offlineVoiceNote")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
