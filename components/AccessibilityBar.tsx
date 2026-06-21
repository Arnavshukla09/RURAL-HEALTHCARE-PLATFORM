"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Accessibility, Type, Volume2, Contrast, VolumeX, ChevronUp } from "lucide-react"

interface AccessibilityBarProps {
  language: string
  setLanguage: (lang: string) => void
}

export function AccessibilityBar({ language, setLanguage }: AccessibilityBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [highContrast, setHighContrast] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const t = {
    en: { title: "Accessibility Options", fontSize: "Font Size", decrease: "Decrease", increase: "Increase", contrast: "High Contrast", language: "Language", readAloud: "Read Aloud", stopReading: "Stop Reading", reset: "Reset Settings", on: "On", off: "Off" },
    hi: { title: "पहुंच विकल्प", fontSize: "फ़ॉन्ट आकार", decrease: "घटाएं", increase: "बढ़ाएं", contrast: "उच्च कंट्रास्ट", language: "भाषा", readAloud: "जोर से पढ़ें", stopReading: "पढ़ना बंद करें", reset: "रीसेट करें", on: "चालू", off: "बंद" }
  }[language as "en" | "hi"] ?? { title: "Accessibility Options", fontSize: "Font Size", decrease: "Decrease", increase: "Increase", contrast: "High Contrast", language: "Language", readAloud: "Read Aloud", stopReading: "Stop Reading", reset: "Reset Settings", on: "On", off: "Off" }

  const adjustFontSize = (dir: "increase" | "decrease") => {
    const next = Math.max(12, Math.min(24, fontSize + (dir === "increase" ? 2 : -2)))
    setFontSize(next)
    document.documentElement.style.fontSize = `${next}px`
  }

  const toggleContrast = () => {
    const next = !highContrast
    setHighContrast(next)
    if (next) {
      document.documentElement.setAttribute("data-contrast", "high")
    } else {
      document.documentElement.removeAttribute("data-contrast")
    }
  }

  const handleReadAloud = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech not supported in this browser")
      return
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const main = document.querySelector("main")
    const text = main ? main.innerText.substring(0, 1000) : document.body.innerText.substring(0, 500)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === "hi" ? "hi-IN" : "en-US"
    utterance.rate = 0.9
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const reset = () => {
    setFontSize(16)
    setHighContrast(false)
    document.documentElement.style.fontSize = "16px"
    document.documentElement.removeAttribute("data-contrast")
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

  // Stop speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  return (
    <>
      <Button
        className="fixed top-20 left-4 z-50 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 shadow-lg p-0"
        onClick={() => setIsOpen(!isOpen)}
        title="Accessibility Options"
      >
        <Accessibility className="h-5 w-5 text-white" />
      </Button>

      {isOpen && (
        <Card className="fixed top-36 left-4 z-40 w-72 shadow-xl border-2 border-purple-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                {t.title}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />{t.fontSize}
                </span>
                <span className="text-xs text-gray-500">{fontSize}px</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => adjustFontSize("decrease")} disabled={fontSize <= 12}>{t.decrease}</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => adjustFontSize("increase")} disabled={fontSize >= 24}>{t.increase}</Button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Contrast className="h-4 w-4" />{t.contrast}
              </span>
              <Button size="sm" variant={highContrast ? "default" : "outline"} onClick={toggleContrast}>
                {highContrast ? t.on : t.off}
              </Button>
            </div>

            {/* Language */}
            <div>
              <p className="text-sm font-medium mb-2">{t.language}</p>
              <div className="flex gap-2">
                <Button size="sm" variant={language === "en" ? "default" : "outline"} className="flex-1" onClick={() => setLanguage("en")}>English</Button>
                <Button size="sm" variant={language === "hi" ? "default" : "outline"} className="flex-1" onClick={() => setLanguage("hi")}>हिंदी</Button>
              </div>
            </div>

            {/* Read Aloud */}
            <Button
              size="sm"
              variant={isSpeaking ? "destructive" : "outline"}
              className="w-full flex items-center gap-2"
              onClick={handleReadAloud}
            >
              {isSpeaking ? <><VolumeX className="h-4 w-4" />{t.stopReading}</> : <><Volume2 className="h-4 w-4" />{t.readAloud}</>}
            </Button>

            {/* Reset */}
            <div className="pt-2 border-t">
              <Button size="sm" variant="secondary" className="w-full" onClick={reset}>{t.reset}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <style>{`
        [data-contrast="high"] {
          filter: invert(1) hue-rotate(180deg);
        }
        [data-contrast="high"] img,
        [data-contrast="high"] video {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </>
  )
}
