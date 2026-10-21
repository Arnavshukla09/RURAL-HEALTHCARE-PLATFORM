"use client"

/**
 * components/floating-chat/index.tsx
 *
 * Modular Floating AI & Navigation Assistant Widget.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — AI Navigation Subsystem
 */

import { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  Loader2,
  Bot,
  Minimize2,
  Map,
} from "lucide-react"

import { useApp } from "@/components/providers/AppProvider"
import { useRouter, usePathname } from "next/navigation"
import {
  startSpeechRecognition,
  stopSpeechRecognition,
  speak,
  stopSpeaking,
  getSpeechLangFromCode,
} from "@/lib/ai/speech"
import { applyFeedback } from "@/lib/ai/query-learner"
import { routeChatMessage } from "@/lib/chat/router"
import { getLiveSuggestions, type SuggestionItem } from "@/lib/chat/suggestions"

import { ChatMessageItem } from "./parts/ChatMessageItem"
import { ChatInputBar } from "./parts/ChatInputBar"
import { SiteGuidePanel } from "./parts/SiteGuidePanel"
import {
  detectNavIntent,
  PAGE_LABELS,
  getWelcomeMessage,
  getQuickActions,
  type ChatMessage,
  type NavButton,
} from "./types"

export function FloatingChat() {
  const pathname = usePathname()
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
        lang: getSpeechLangFromCode(language),
        onResult: (res) => {
          setInput((prev) => (prev ? prev + " " + res.transcript : res.transcript))
          setIsListening(false)
        },
        onError: (err) => {
          console.error("Speech error:", err)
          setIsListening(false)
        },
        onEnd: () => setIsListening(false),
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
        lang: getSpeechLangFromCode(language),
        onEnd: () => setSpeakingMsgIdx(null),
        onError: () => setSpeakingMsgIdx(null),
      })
    }
  }

  const handleFeedback = async (msgIdx: number, queryId: string, isUp: boolean) => {
    if (!queryId) return
    await applyFeedback(queryId, isUp)
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIdx ? { ...m, feedback: isUp ? 1 : -1 } : m))
    )
  }

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([getWelcomeMessage(en)])
    }
  }, [open, en, messages.length])

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
    setMessages((prev) => [
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
        ],
      },
    ])
    setShowGuide(false)
  }

  const handleButtonClick = (btn: NavButton) => {
    if (btn.action === "show_guide") {
      setShowGuide(true)
      setMessages((prev) => [
        ...prev,
        { role: "user", content: en ? "Show me the site guide" : "साइट गाइड दिखाएं" },
        {
          role: "assistant",
          content: en
            ? "Here's everything available on RuralHealth. Tap any option to go there instantly!"
            : "RuralHealth पर उपलब्ध सभी विकल्प यहां हैं। किसी भी विकल्प पर टैप करें!",
        },
      ])
    } else if (btn.page) {
      const pageInfo = PAGE_LABELS[btn.page]
      const label = pageInfo ? (en ? pageInfo.en : pageInfo.hi) : btn.page
      navigateTo(btn.page, label)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    const navIntent = detectNavIntent(text)
    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setShowGuide(false)

    if (navIntent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: en
            ? `Sure! Taking you to **${navIntent.label}** right now. 🚀`
            : `ज़रूर! **${navIntent.label}** पर ले जा रहा हूं। 🚀`,
          navButtons: [
            { label: `→ ${navIntent.label}`, page: navIntent.page },
            { label: en ? "🗺️ More Options" : "🗺️ और विकल्प", action: "show_guide" },
          ],
        },
      ])
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

      const aiNavIntent = detectNavIntent(result.reply)
      const navBtns: NavButton[] = aiNavIntent
        ? [{ label: `→ ${aiNavIntent.label}`, page: aiNavIntent.page }]
        : []

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          navButtons: navBtns.length > 0 ? navBtns : undefined,
          queryId: result.queryId,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: en
            ? "For your safety: If symptoms are serious, please call 108 or visit your nearest PHC immediately."
            : "आपकी सुरक्षा के लिए: यदि लक्षण गंभीर हैं, तो तुरंत 108 पर कॉल करें या नजदीकी प्राथमिक स्वास्थ्य केंद्र जाएं।",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = getQuickActions(en)

  if (pathname === "/emergency") {
    return null
  }

  return (
    <>
      {/* Floating Action Trigger Button */}
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

      {/* Floating Chat Modal */}
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
                onClick={() => setShowGuide((s) => !s)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-[10px] font-medium"
                aria-label={en ? "Toggle site map" : "साइट मैप टॉगल करें"}
                title={en ? "Site map" : "साइट मैप"}
              >
                <Map className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={en ? "Minimize chat" : "चैट बंद करें"}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Site Guide Panel */}
          {showGuide && (
            <SiteGuidePanel
              en={en}
              onClose={() => setShowGuide(false)}
              onNavigate={navigateTo}
            />
          )}

          {/* Messages list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
            style={{ maxHeight: "45vh" }}
          >
            {messages.map((msg, i) => (
              <ChatMessageItem
                key={i}
                msg={msg}
                idx={i}
                en={en}
                speakingMsgIdx={speakingMsgIdx}
                onToggleSpeak={toggleSpeak}
                onFeedback={handleFeedback}
                onButtonClick={handleButtonClick}
              />
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick action chips */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action)
                      setTimeout(() => handleSend(), 50)
                    }}
                    className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Bar */}
          <ChatInputBar
            en={en}
            input={input}
            setInput={setInput}
            loading={loading}
            isListening={isListening}
            toggleListen={toggleListen}
            onSend={handleSend}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            inputRef={inputRef}
          />
        </div>
      )}
    </>
  )
}

export default FloatingChat
