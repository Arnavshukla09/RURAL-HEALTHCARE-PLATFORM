"use client"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Send, ImagePlus, Mic, MicOff, Bot, User, AlertTriangle, Loader2, Stethoscope, Camera, X } from "lucide-react"

interface AIConsultationChatProps { language: string; setCurrentPage: (page: string) => void }
interface Message { role: "user" | "assistant"; content: string; image?: string; severity?: string; conditions?: string[]; specialist?: string }

export function AIConsultationChat({ language, setCurrentPage }: AIConsultationChatProps) {
  const en = language === "en"
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: en ? "Hello! I'm your AI health assistant. Describe your symptoms, upload an image, or use voice input. I can help identify conditions and recommend specialists." : "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ। अपने लक्षण बताएं, छवि अपलोड करें, या आवाज़ इनपुट का उपयोग करें।" }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      setImageBase64(result.split(",")[1])
    }
    reader.readAsDataURL(file)
  }

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert(en ? "Voice not supported in this browser" : "इस ब्राउज़र में आवाज़ समर्थित नहीं"); return }
    if (isListening) { setIsListening(false); return }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN"
    recognition.continuous = false
    recognition.onresult = (event: any) => { setInput(prev => prev + " " + event.results[0][0].transcript); setIsListening(false) }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text && !imageBase64) return
    const userMsg: Message = { role: "user", content: text || (en ? "Analyzing uploaded image..." : "अपलोड की गई छवि का विश्लेषण..."), image: imagePreview || undefined }
    setMessages(prev => [...prev, userMsg])
    setInput(""); setImagePreview(null); setIsLoading(true); scrollToBottom()

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, imageBase64, language, history: messages.slice(-6) }),
      })
      const data = await res.json()
      setImageBase64(null)
      if (data.error) {
        // Fallback local analysis
        const fallback = localAnalysis(text, language)
        setMessages(prev => [...prev, fallback])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.response, severity: data.severity, conditions: data.conditions, specialist: data.specialist }])
      }
    } catch {
      setMessages(prev => [...prev, localAnalysis(text, language)])
    } finally { setIsLoading(false); scrollToBottom() }
  }

  const localAnalysis = (text: string, lang: string): Message => {
    const t = text.toLowerCase()
    const en = lang === "en"
    if (t.includes("fever") || t.includes("बुखार")) return { role: "assistant", content: en ? "Based on your symptoms of fever, possible conditions include:\n• **Viral Fever** (60%)\n• **Malaria** (20%)\n• **Dengue** (15%)\n\n**Immediate steps:** Take paracetamol, stay hydrated, rest.\n**See a doctor** if fever persists >3 days or goes above 103°F." : "बुखार के लक्षणों के आधार पर, संभावित स्थितियां:\n• **वायरल बुखार** (60%)\n• **मलेरिया** (20%)\n\n**तत्काल कदम:** पैरासिटामोल लें, हाइड्रेटेड रहें।", severity: "moderate", conditions: ["Viral Fever", "Malaria", "Dengue"], specialist: "General Physician" }
    if (t.includes("headache") || t.includes("सिर")) return { role: "assistant", content: en ? "For headache, possible causes:\n• **Tension Headache** (50%)\n• **Migraine** (30%)\n• **Sinusitis** (15%)\n\n**Steps:** Rest in a dark room, stay hydrated, take paracetamol." : "सिर दर्द के कारण:\n• **तनाव सिरदर्द** (50%)\n• **माइग्रेन** (30%)\n\n**कदम:** अंधेरे कमरे में आराम करें।", severity: "mild", conditions: ["Tension Headache", "Migraine"], specialist: "Neurologist" }
    return { role: "assistant", content: en ? "I've noted your symptoms. For a thorough analysis, please provide more details about:\n• When did symptoms start?\n• Any other symptoms?\n• Any medications you're taking?\n\nYou can also upload an image for visual analysis." : "मैंने आपके लक्षण नोट किए हैं। विस्तृत विश्लेषण के लिए और जानकारी दें।", severity: "mild", conditions: [], specialist: "General Physician" }
  }

  const severityColors: Record<string, string> = { mild: "bg-green-100 text-green-700", moderate: "bg-amber-100 text-amber-700", severe: "bg-red-100 text-red-700", emergency: "bg-red-200 text-red-800" }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{en ? "AI Health Assistant" : "AI स्वास्थ्य सहायक"}</h1>
          <p className="text-muted-foreground text-sm">{en ? "Text, image, or voice — get instant health guidance" : "टेक्स्ट, छवि, या आवाज़ — तत्काल स्वास्थ्य मार्गदर्शन"}</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[55vh] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === "user" ? "bg-teal-600 text-white rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.role === "assistant" ? <Bot className="h-4 w-4 text-teal-600" /> : <User className="h-4 w-4" />}
                      <span className="text-xs font-medium">{msg.role === "assistant" ? "AI Assistant" : en ? "You" : "आप"}</span>
                    </div>
                    {msg.image && <img src={msg.image} alt="Upload" className="rounded-lg max-h-40 mb-2" />}
                    <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                    {msg.severity && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge className={`text-xs ${severityColors[msg.severity]}`}>{msg.severity}</Badge>
                        {msg.specialist && <Badge variant="outline" className="text-xs"><Stethoscope className="h-3 w-3 mr-1" />{msg.specialist}</Badge>}
                      </div>
                    )}
                    {msg.specialist && msg.role === "assistant" && msg.severity && (
                      <Button size="sm" className="mt-2 h-7 text-xs gradient-primary text-white" onClick={() => setCurrentPage("consultation")}>
                        {en ? "Book Specialist" : "विशेषज्ञ बुक करें"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-muted rounded-2xl p-3"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /></div></div>}
              <div ref={chatEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-4 pb-2"><div className="relative inline-block"><img src={imagePreview} alt="Preview" className="h-16 rounded-lg border" /><button onClick={() => { setImagePreview(null); setImageBase64(null) }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></div></div>
            )}

            {/* Input Bar */}
            <div className="border-t p-3 flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 shrink-0 ${isListening ? "text-red-500 animate-pulse" : ""}`} onClick={toggleVoice}>
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
              </Button>
              <input className="flex-1 h-9 px-3 text-sm border rounded-lg focus:outline-none focus:border-teal-500"
                placeholder={en ? "Describe your symptoms..." : "अपने लक्षण बताएं..."} value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} disabled={isLoading} />
              <Button size="sm" className="h-9 gradient-primary text-white" onClick={sendMessage} disabled={isLoading || (!input.trim() && !imageBase64)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
