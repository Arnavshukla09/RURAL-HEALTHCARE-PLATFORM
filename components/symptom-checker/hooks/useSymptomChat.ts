"use client"

/**
 * components/symptom-checker/hooks/useSymptomChat.ts
 *
 * Custom hook managing inline medical AI triage conversation, speech recognition,
 * and bi-directional Hindi/English translation.
 *
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Triage Subsystem
 */

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { startSpeechRecognition, stopSpeechRecognition } from "@/lib/ai/speech"
import { routeChatMessage } from "@/lib/chat/router"

export interface SymptomChatMessage {
  role: "user" | "assistant"
  content: string
  contentHi?: string
  contentEn?: string
  displayLang?: "en" | "hi"
}

export function useSymptomChat(language: string, selectedSymptoms: string[]) {
  const en = language === "en"
  const { toast } = useToast()

  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<SymptomChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)

  const toggleListen = () => {
    if (isListening) {
      stopSpeechRecognition()
      setIsListening(false)
    } else {
      const supported = startSpeechRecognition({
        lang: language === "en" ? "en-IN" : "hi-IN",
        onResult: (res) => {
          setChatInput((prev) => (prev ? prev + " " + res.transcript : res.transcript))
          setIsListening(false)
        },
        onError: (err) => {
          console.error("Speech error:", err)
          setIsListening(false)
          toast({ title: err, variant: "destructive" })
        },
        onEnd: () => setIsListening(false),
      })
      if (supported) setIsListening(true)
      else
        toast({
          title: en
            ? "Speech recognition not supported."
            : "स्पीच रिकग्निशन समर्थित नहीं है।",
          variant: "destructive",
        })
    }
  }

  const handleToggleMessageLanguage = async (idx: number) => {
    const msg = chatMessages[idx]
    if (!msg || msg.role !== "assistant" || translatingIdx !== null) return

    const currentLang = msg.displayLang || (language === "hi" ? "hi" : "en")
    const targetLang = currentLang === "en" ? "hi" : "en"

    if (targetLang === "hi" && msg.contentHi) {
      setChatMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, displayLang: "hi" } : m))
      )
      return
    }
    if (targetLang === "en" && msg.contentEn) {
      setChatMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, displayLang: "en" } : m))
      )
      return
    }

    setTranslatingIdx(idx)
    try {
      const prompt =
        targetLang === "hi"
          ? `कृपया इस संदेश का स्पष्ट और सरल हिंदी में अनुवाद करें:\n\n${msg.content}`
          : `Please translate this medical advice into clear, accurate English:\n\n${msg.content}`

      const result = await routeChatMessage({
        message: prompt,
        language: targetLang,
        history: [],
      })

      setChatMessages((prev) =>
        prev.map((m, i) => {
          if (i !== idx) return m
          return {
            ...m,
            displayLang: targetLang,
            contentHi: targetLang === "hi" ? result.reply : m.contentHi,
            contentEn: targetLang === "en" ? result.reply : m.contentEn,
          }
        })
      )
    } catch (err) {
      console.warn("Translation failed:", err)
    } finally {
      setTranslatingIdx(null)
    }
  }

  const handleChat = async (
    overrideText?: string,
    specificAiResult?: any,
    targetLang?: "en" | "hi"
  ) => {
    const text = overrideText || chatInput.trim()
    if (!text || chatLoading) return

    const activeLanguage = targetLang || (language === "hi" ? "hi" : "en")
    const userMsg = { role: "user" as const, content: text }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    if (!overrideText) setChatInput("")
    setChatLoading(true)

    try {
      const result = await routeChatMessage({
        message: text,
        language: activeLanguage,
        history: chatMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.displayLang === "hi" && m.contentHi ? m.contentHi : m.content,
        })),
        symptomContext: selectedSymptoms,
      })

      const assistantMsg: SymptomChatMessage = {
        role: "assistant",
        content: result.reply,
        displayLang: activeLanguage,
        contentEn: result.replyEn || (activeLanguage === "en" ? result.reply : undefined),
        contentHi: result.replyHi || (activeLanguage === "hi" ? result.reply : undefined),
      }

      setChatMessages((prev) => [...prev, assistantMsg])
    } catch {
      const emergencyEn =
        "• Rest adequately and keep yourself well hydrated with boiled water or ORS.\n• Monitor your temperature and symptoms closely.\n• If symptoms worsen or you feel severe discomfort, please consult your nearest Community Health Centre (CHC) or call 108 immediately."
      const emergencyHi =
        "• पर्याप्त आराम करें और ओआरएस या उबले हुए पानी से हाइड्रेटेड रहें।\n• अपने तापमान और लक्षणों पर नज़र रखें।\n• यदि लक्षण बढ़ें या सांस लेने में तकलीफ हो, तो तुरंत नजदीकी स्वास्थ्य केंद्र (CHC) जाएँ या 108 पर कॉल करें।"

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: activeLanguage === "hi" ? emergencyHi : emergencyEn,
          contentEn: emergencyEn,
          contentHi: emergencyHi,
          displayLang: activeLanguage,
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const resetChat = () => {
    setChatMessages([])
    setChatInput("")
  }

  return {
    chatInput,
    setChatInput,
    chatMessages,
    setChatMessages,
    chatLoading,
    translatingIdx,
    isListening,
    toggleListen,
    handleChat,
    handleToggleMessageLanguage,
    resetChat,
  }
}
