"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Map, Stethoscope, Calendar, FileText, AlertTriangle, Heart, Home, Info, Mic, MicOff, Volume2, ThumbsUp, ThumbsDown } from "lucide-react"

import { useApp } from "@/components/providers/AppProvider"
import { useRouter } from "next/navigation"
import { lookupOffline } from "@/lib/offline/offline-ai"
import { startSpeechRecognition, stopSpeechRecognition, speak, stopSpeaking } from "@/lib/ai/speech"
import { applyFeedback } from "@/lib/ai/query-learner"
import { routeChatMessage } from "@/lib/chat/router"
import { getLiveSuggestions, SuggestionItem } from "@/lib/chat/suggestions"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  navButtons?: NavButton[]
  queryId?: string
  feedback?: 1 | -1
}

interface NavButton {
  label: string
  page?: string
  action?: string
  icon?: string
}

// Navigation keywords → page mapping
const NAV_KEYWORDS: Record<string, { page: string; label: string }> = {
  symptom: { page: "symptom-checker", label: "Symptom Checker" },
  symptoms: { page: "symptom-checker", label: "Symptom Checker" },
  लक्षण: { page: "symptom-checker", label: "लक्षण जांचक" },
  hospital: { page: "locations", label: "Find Hospitals" },
  hospitals: { page: "locations", label: "Find Hospitals" },
  clinic: { page: "locations", label: "Find Clinics" },
  map: { page: "locations", label: "Health Facilities Map" },
  facility: { page: "locations", label: "Health Facilities" },
  अस्पताल: { page: "locations", label: "अस्पताल खोजें" },
  appointment: { page: "appointments", label: "Book Appointment" },
  appointments: { page: "appointments", label: "My Appointments" },
  book: { page: "consultation", label: "Book Consultation" },
  consult: { page: "consultation", label: "Consult a Doctor" },
  doctor: { page: "consultation", label: "Find Doctor" },
  doctors: { page: "directory", label: "Doctor Directory" },
  अपॉइंटमेंट: { page: "appointments", label: "अपॉइंटमेंट" },
  record: { page: "records", label: "Medical Records" },
  records: { page: "records", label: "Medical Records" },
  prescription: { page: "records", label: "My Records" },
  रिकॉर्ड: { page: "records", label: "मेडिकल रिकॉर्ड" },
  emergency: { page: "emergency", label: "Emergency Services" },
  आपातकाल: { page: "emergency", label: "आपातकालीन सेवाएं" },
  camp: { page: "camps", label: "Health Camps" },
  camps: { page: "camps", label: "Health Camps" },
  health: { page: "health-info", label: "Health Information" },
  information: { page: "health-info", label: "Health Info Hub" },
  dashboard: { page: "dashboard", label: "My Dashboard" },
  home: { page: "dashboard", label: "Go Home" },
}

const SITE_GUIDE_PAGES = [
  { icon: "🏠", label: "Dashboard", labelHi: "डैशबोर्ड", page: "dashboard" },
  { icon: "🩺", label: "Symptom Checker", labelHi: "लक्षण जांचक", page: "symptom-checker" },
  { icon: "👨‍⚕️", label: "Book a Doctor", labelHi: "डॉक्टर बुक करें", page: "consultation" },
  { icon: "📅", label: "My Appointments", labelHi: "मेरी अपॉइंटमेंट", page: "appointments" },
  { icon: "📋", label: "Medical Records", labelHi: "मेडिकल रिकॉर्ड", page: "records" },
  { icon: "🗺️", label: "Nearby Hospitals", labelHi: "निकटतम अस्पताल", page: "locations" },
  { icon: "⛺", label: "Health Camps", labelHi: "स्वास्थ्य शिविर", page: "camps" },
  { icon: "📚", label: "Health Info", labelHi: "स्वास्थ्य जानकारी", page: "health-info" },
  { icon: "🆘", label: "Emergency", labelHi: "आपातकाल", page: "emergency" },
]

function detectNavIntent(text: string): { page: string; label: string } | null {
  const lower = text.toLowerCase()
  for (const [kw, nav] of Object.entries(NAV_KEYWORDS)) {
    if (lower.includes(kw)) return nav
  }
  return null
}

export function FloatingChat() {
  const { language } = useApp()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const en = language === "en"

  // Live suggestions debounce (150ms)
  useEffect(() => {
    if (!input || input.trim().length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      const items = getLiveSuggestions(input, language, 4)
      setSuggestions(items)
    }, 150)

    return () => clearTimeout(timer)
  }, [input, language])

  const toggleListen = () => {
    if (isListening) {
      stopSpeechRecognition()
      setIsListening(false)
    } else {
      startSpeechRecognition({
        lang: language === 'en' ? 'en-IN' : 'hi-IN',
        onResult: (res) => {
          setInput((prev) => prev ? prev + ' ' + res.transcript : res.transcript)
          setIsListening(false)
        },
        onError: (err) => {
          console.error('Speech error:', err)
          setIsListening(false)
        },
        onEnd: () => setIsListening(false)
      })
      setIsListening(true)
    }
  }

  const toggleSpeak = (idx: number, text: string) => {
    if (speakingMsgIdx === idx) {
      stopSpeaking()
      setSpeakingMsgIdx(null)
    } else {
      setSpeakingMsgIdx(idx)
      speak(text, {
        lang: language === 'en' ? 'en-IN' : 'hi-IN',
        onEnd: () => setSpeakingMsgIdx(null),
        onError: () => setSpeakingMsgIdx(null)
      })
    }
  }

  const handleFeedback = async (msgIdx: number, queryId: string, isUp: boolean) => {
    if (!queryId) return
    await applyFeedback(queryId, isUp)
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, feedback: isUp ? 1 : -1 } : m))
  }

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: en
          ? "👋 Hi! I'm your **RuralHealth Guide**. I can:\n\n• Navigate you to any section of this website\n• Answer health questions in real-time\n• Explain your symptoms\n• Find nearby hospitals\n\nTap a quick action below or ask me anything!"
          : "👋 नमस्ते! मैं आपका **ग्रामीण स्वास्थ्य गाइड** हूं। मैं कर सकता हूं:\n\n• वेबसाइट के किसी भी भाग में नेविगेट करना\n• स्वास्थ्य प्रश्नों का उत्तर देना\n• लक्षण समझाना\n• निकटतम अस्पताल खोजना\n\nनीचे त्वरित विकल्प चुनें या कुछ पूछें!",
        navButtons: [
          { label: en ? "🗺️ Navigate Site" : "🗺️ साइट गाइड", action: "show_guide" },
          { label: en ? "🩺 Check Symptoms" : "🩺 लक्षण जांचें", page: "symptom-checker" },
          { label: en ? "🆘 Emergency" : "🆘 आपातकाल", page: "emergency" },
          { label: en ? "👨‍⚕️ Book Doctor" : "👨‍⚕️ डॉक्टर बुक करें", page: "consultation" },
        ]
      }])
    }
  }, [open, en])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, showGuide])

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  const navigateTo = (page: string, label: string) => {
    if (page) {
      router.push(page === "home" ? "/" : `/${page}`)
    }
    setMessages(prev => [
      ...prev,
      { role: "user", content: en ? `Take me to ${label}` : `मुझे ${label} पर ले जाएं` },
      {
        role: "assistant",
        content: en
          ? `✅ Opening **${label}** for you now! Let me know if you need anything else.`
          : `✅ **${label}** खोल रहा हूं! कुछ और चाहिए तो बताएं।`,
        navButtons: [
          { label: en ? "🏠 Back to Home" : "🏠 होम पर जाएं", page: "dashboard" },
          { label: en ? "🗺️ More Options" : "🗺️ और विकल्प", action: "show_guide" },
        ]
      }
    ])
    setShowGuide(false)
  }

  const handleButtonClick = (btn: NavButton) => {
    if (btn.action === "show_guide") {
      setShowGuide(true)
      setMessages(prev => [
        ...prev,
        { role: "user", content: en ? "Show me the site guide" : "साइट गाइड दिखाएं" },
        {
          role: "assistant",
          content: en
            ? "Here's everything available on RuralHealth. Tap any option to go there instantly!"
            : "RuralHealth पर उपलब्ध सभी विकल्प यहां हैं। किसी भी विकल्प पर टैप करें!",
        }
      ])
    } else if (btn.page) {
      const pageLabels: Record<string, string> = {
        "symptom-checker": en ? "Symptom Checker" : "लक्षण जांचक",
        consultation: en ? "Book Consultation" : "परामर्श बुक करें",
        appointments: en ? "Appointments" : "अपॉइंटमेंट",
        records: en ? "Medical Records" : "मेडिकल रिकॉर्ड",
        locations: en ? "Health Facilities" : "स्वास्थ्य केंद्र",
        camps: en ? "Health Camps" : "स्वास्थ्य शिविर",
        "health-info": en ? "Health Info" : "स्वास्थ्य जानकारी",
        emergency: en ? "Emergency" : "आपातकाल",
        dashboard: en ? "Dashboard" : "डैशबोर्ड",
        directory: en ? "Doctor Directory" : "डॉक्टर डायरेक्टरी",
      }
      navigateTo(btn.page, pageLabels[btn.page] || btn.page)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput("")

    // Check for navigation intent
    const navIntent = detectNavIntent(text)

    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setShowGuide(false)

    if (navIntent) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: en
          ? `Sure! Taking you to **${navIntent.label}** right now. 🚀`
          : `ज़रूर! **${navIntent.label}** पर ले जा रहा हूं। 🚀`,
        navButtons: [
          { label: `→ ${navIntent.label}`, page: navIntent.page },
          { label: en ? "🗺️ More Options" : "🗺️ और विकल्प", action: "show_guide" },
        ]
      }])
      setTimeout(() => navigateTo(navIntent.page || "", navIntent.label), 600)
      return
    }

    setLoading(true)

    try {
      const result = await routeChatMessage({
        message: text,
        language,
        history: messages.slice(-6),
      })

      // Check if AI response mentions navigating somewhere
      const aiNavIntent = detectNavIntent(result.reply)
      const navBtns: NavButton[] = aiNavIntent
        ? [{ label: `→ ${aiNavIntent.label}`, page: aiNavIntent.page }]
        : []

      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.reply,
        navButtons: navBtns.length > 0 ? navBtns : undefined,
        queryId: result.queryId
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: en
          ? "For your safety: If symptoms are serious, please call 108 or visit your nearest PHC immediately."
          : "आपकी सुरक्षा के लिए: यदि लक्षण गंभीर हैं, तो तुरंत 108 पर कॉल करें या नजदीकी प्राथमिक स्वास्थ्य केंद्र जाएं।"
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = en
    ? ["Check my symptoms", "Find nearest hospital", "I need emergency help", "Book an appointment"]
    : ["मेरे लक्षण जांचें", "निकटतम अस्पताल खोजें", "मुझे आपातकालीन मदद चाहिए", "अपॉइंटमेंट बुक करें"]

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open health assistant chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  {en ? "RuralHealth Guide" : "स्वास्थ्य गाइड"}
                </h3>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-green-300 rounded-full" />
                  {en ? "AI + Navigation Assistant" : "AI + नेविगेशन सहायक"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => { setShowGuide(s => !s) }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-[10px] font-medium"
                aria-label={en ? "Toggle site map" : "साइट मैप टॉगल करें"}
                title={en ? "Site map" : "साइट मैप"}
              >
                <Map className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" aria-label={en ? "Minimize chat" : "चैट बंद करें"}>
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Site Guide Panel (slide-in) */}
          {showGuide && (
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">{en ? "📍 Navigate to..." : "📍 नेविगेट करें..."}</p>
                <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SITE_GUIDE_PAGES.map(p => (
                  <button
                    key={p.page}
                    onClick={() => navigateTo(p.page, en ? p.label : p.labelHi)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-center"
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-[10px] font-medium text-gray-700 leading-tight">{en ? p.label : p.labelHi}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: "45vh" }}>
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-start gap-2 max-w-[88%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user" ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50 justify-between">
                          <button 
                            onClick={() => toggleSpeak(i, msg.content)}
                            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${speakingMsgIdx === i ? "text-teal-600 bg-teal-50" : "text-gray-500"}`}
                            title={speakingMsgIdx === i ? (en ? "Stop speaking" : "बोलना बंद करें") : (en ? "Read aloud" : "जोर से पढ़ें")}
                          >
                            <Volume2 className={`h-3.5 w-3.5 ${speakingMsgIdx === i ? "animate-pulse" : ""}`} />
                          </button>
                          
                          {msg.queryId && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleFeedback(i, msg.queryId!, true)}
                                disabled={msg.feedback !== undefined}
                                className={`p-1.5 rounded transition-colors ${msg.feedback === 1 ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleFeedback(i, msg.queryId!, false)}
                                disabled={msg.feedback !== undefined}
                                className={`p-1.5 rounded transition-colors ${msg.feedback === -1 ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Navigation buttons attached to message */}
                {msg.navButtons && msg.navButtons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {msg.navButtons.map((btn, bi) => (
                      <button
                        key={bi}
                        onClick={() => handleButtonClick(btn)}
                        className="text-xs bg-white text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-50 hover:border-teal-400 transition-all shadow-sm font-medium"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick action chips — first message only */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickActions.map((action, i) => (
                  <button key={i} onClick={() => { setInput(action); setTimeout(() => handleSend(), 50) }}
                    className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            {/* Live Suggestions Chips */}
            {suggestions.length > 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-20 overflow-y-auto" role="listbox" aria-label="Suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const textToSend = en ? item.queryEn : item.queryHi
                      setInput(textToSend)
                      setSuggestions([])
                      setTimeout(() => handleSend(), 50)
                    }}
                    className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-all text-left flex items-center gap-1 shadow-xs"
                  >
                    <span>💡</span>
                    <span>{en ? item.textEn : item.textHi}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); setSuggestions([]); handleSend() }} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={isListening ? (en ? "Listening..." : "सुन रहा हूँ...") : (en ? "Ask or say 'go to appointments'..." : "पूछें या 'अपॉइंटमेंट पर जाएं'...")}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label={en ? "Send message" : "संदेश भेजें"}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
