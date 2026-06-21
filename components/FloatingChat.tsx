"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react"

interface FloatingChatProps {
  language: string
  setCurrentPage?: (page: string) => void
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function FloatingChat({ language, setCurrentPage }: FloatingChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const en = language === "en"

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: en
          ? "👋 Hi! I'm your RuralHealth AI assistant. I can help you with:\n\n• Understanding your symptoms\n• Finding nearby doctors & hospitals\n• Explaining medical reports\n• First aid guidance\n• Vaccination schedules\n\nHow can I help you today?"
          : "👋 नमस्ते! मैं आपका ग्रामीण स्वास्थ्य AI सहायक हूं। मैं इनमें मदद कर सकता हूं:\n\n• लक्षण समझना\n• डॉक्टर और अस्पताल खोजना\n• चिकित्सा रिपोर्ट समझाना\n• प्राथमिक उपचार\n• टीकाकरण शेड्यूल\n\nआज मैं कैसे मदद कर सकता हूं?"
      }])
    }
  }, [open, en])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: en ? "I'm sorry, the AI service is temporarily unavailable. Please try the Symptom Checker instead." : "क्षमा करें, AI सेवा अभी उपलब्ध नहीं है। कृपया लक्षण जांचकर्ता का उपयोग करें।"
        }])
        setLoading(false)
        return
      }

      // Build conversation history for context
      const history = messages.slice(-8).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }))

      const systemPrompt = `You are RuralHealth AI — a compassionate, knowledgeable health assistant for rural India. 
Rules:
- Always respond in ${language === "hi" ? "Hindi" : "English"}
- Keep responses concise (max 150 words) but helpful
- For serious symptoms (chest pain, difficulty breathing, high fever >103°F), ALWAYS say to call 108 or go to nearest hospital
- You can suggest users check their symptoms using the Symptom Checker feature
- You can help explain medical terms, prescriptions, and lab reports in simple language
- Never diagnose — say "this could be..." and recommend seeing a doctor
- Be culturally sensitive to rural Indian context
- For emergencies, provide first aid steps AND tell them to call 108
- You can suggest booking a consultation for non-emergency issues`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "Understood. I am RuralHealth AI assistant." }] },
              ...history,
              { role: "user", parts: [{ text }] }
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
          }),
        }
      )

      if (!response.ok) throw new Error("API error")

      const data = await response.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || (en ? "Sorry, I couldn't process that. Please try again." : "क्षमा करें, मैं इसे संसाधित नहीं कर सका।")

      setMessages(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: en ? "Connection error. Please check your internet and try again." : "कनेक्शन त्रुटि। कृपया इंटरनेट जांचें और पुनः प्रयास करें।"
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = en
    ? ["Check my symptoms", "Find nearest hospital", "First aid for burns", "Explain my prescription"]
    : ["मेरे लक्षण जांचें", "निकटतम अस्पताल", "जलने की प्राथमिक चिकित्सा", "प्रिस्क्रिप्शन समझाएं"]

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open health assistant chat"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Pulse dot */}
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  {en ? "Health Assistant" : "स्वास्थ्य सहायक"}
                </h3>
                <p className="text-[10px] opacity-80">
                  {en ? "Powered by Gemini AI" : "Gemini AI द्वारा संचालित"}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: "45vh" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
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
                  </div>
                </div>
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

            {/* Quick actions (only when few messages) */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickActions.map((action, i) => (
                  <button key={i} onClick={() => { setInput(action); setTimeout(handleSend, 50) }}
                    className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={en ? "Ask about your health..." : "अपनी स्वास्थ्य के बारे में पूछें..."}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
