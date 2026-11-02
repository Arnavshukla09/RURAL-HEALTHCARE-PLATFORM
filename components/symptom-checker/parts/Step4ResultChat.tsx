"use client"

/**
 * components/symptom-checker/parts/Step4ResultChat.tsx
 *
 * Clinical AI triage diagnosis card, bilingual voice/text consultation chat, and referrals.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Bot,
  Send,
  Mic,
  MicOff,
  Languages,
  Loader2,
  Stethoscope,
  MapPin,
  Home,
} from "lucide-react"
import { URGENCY_STYLES } from "../types"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  contentHi?: string
  contentEn?: string
  displayLang?: "en" | "hi"
}

interface Step4ResultChatProps {
  en: boolean
  language: string
  aiResult: any
  chatMessages: ChatMessage[]
  chatInput: string
  setChatInput: (val: string) => void
  chatLoading: boolean
  isListening: boolean
  toggleListen: () => void
  handleChat: (overrideText?: string, specificAiResult?: any, targetLang?: "en" | "hi") => void
  handleToggleMessageLanguage: (idx: number) => void
  translatingIdx: number | null
  onReset: () => void
}

export function Step4ResultChat({
  en,
  language,
  aiResult,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  isListening,
  toggleListen,
  handleChat,
  handleToggleMessageLanguage,
  translatingIdx,
  onReset,
}: Step4ResultChatProps) {
  const router = useRouter()
  const urgencyStyle = aiResult
    ? URGENCY_STYLES[aiResult.urgency] || URGENCY_STYLES.low
    : URGENCY_STYLES.low

  return (
    <div className="space-y-4">
      {/* Urgency card */}
      <Card className={`border-2 ${urgencyStyle.border} ${urgencyStyle.bg}`}>
        <CardContent className="pt-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">{urgencyStyle.icon}</span>
            <div>
              <h2 className="text-xl font-bold">
                {aiResult.urgency === "emergency"
                  ? en ? "🚨 Seek Emergency Care NOW" : "🚨 तुरंत आपातकालीन देखभाल लें"
                  : aiResult.urgency === "high"
                  ? en ? "⚠️ See a Doctor Today" : "⚠️ आज डॉक्टर से मिलें"
                  : aiResult.urgency === "medium"
                  ? en ? "Book a Consultation" : "परामर्श बुक करें"
                  : en ? "Home Care Recommended" : "घरेलू देखभाल अनुशंसित"}
              </h2>
              {aiResult.specialistNeeded && (
                <p className="text-sm mt-1 font-medium opacity-80">
                  {en ? `Specialist: ${aiResult.specialistNeeded}` : `विशेषज्ञ: ${aiResult.specialistNeeded}`}
                </p>
              )}
            </div>
          </div>

          {/* Inline Chat Interface */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-teal-600" />
                {en ? "Discuss your symptoms with AI" : "AI के साथ अपने लक्षणों पर चर्चा करें"}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 h-64 overflow-y-auto mb-3 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-auto mb-auto">
                  {en
                    ? "Ask any questions about your condition, home remedies, or next steps."
                    : "अपनी स्थिति, घरेलू उपचार, या अगले कदमों के बारे में कोई भी प्रश्न पूछें।"}
                </p>
              ) : (
                chatMessages.map((msg, i) => {
                  const isAssistant = msg.role === "assistant"
                  const activeMsgLang = msg.displayLang || (language === "hi" ? "hi" : "en")
                  const displayedContent =
                    activeMsgLang === "hi"
                      ? msg.contentHi || msg.content
                      : msg.contentEn || msg.content

                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`whitespace-pre-wrap max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-teal-600 text-white rounded-tr-none"
                            : "bg-white border rounded-tl-none text-gray-800 shadow-sm"
                        }`}
                      >
                        {displayedContent}
                        {isAssistant && (
                          <div className="mt-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                            <button
                              onClick={() => handleToggleMessageLanguage(i)}
                              disabled={translatingIdx === i}
                              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-full transition-all font-medium border border-teal-200"
                            >
                              <Languages className="h-3 w-3" />
                              {translatingIdx === i
                                ? activeMsgLang === "en"
                                  ? "हिंदी में अनुवाद हो रहा है..."
                                  : "Translating to English..."
                                : activeMsgLang === "en"
                                ? "हिन्दी में देखें (Switch to Hindi)"
                                : "View in English"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-xl rounded-tl-none px-3 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleListen}
                className={isListening ? "animate-pulse" : ""}
                title={en ? "Use voice input" : "आवाज़ का प्रयोग करें"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder={
                  en
                    ? isListening
                      ? "Listening..."
                      : "Type your question..."
                    : isListening
                    ? "सुन रहा हूँ..."
                    : "अपना प्रश्न टाइप करें..."
                }
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
              <Button
                onClick={() => handleChat()}
                disabled={!chatInput.trim() || chatLoading}
                className="gradient-primary text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(aiResult.urgency === "emergency" || aiResult.urgency === "high") && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => window.open("tel:108")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {en ? "Call Emergency 108" : "आपातकाल 108 पर कॉल करें"}
          </Button>
        )}
        <Button
          size="lg"
          className="w-full gradient-primary text-white"
          onClick={() => router.push("/consultation")}
        >
          <Stethoscope className="mr-2 h-4 w-4" />
          {en ? "Book Consultation" : "परामर्श बुक करें"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => router.push("/locations")}>
          <MapPin className="mr-2 h-4 w-4" />
          {en ? "Find Nearest Hospital" : "निकटतम अस्पताल खोजें"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="col-span-full">
          <Home className="mr-2 h-4 w-4" />
          {en ? "Check Again" : "फिर से जांचें"}
        </Button>
      </div>
    </div>
  )
}
