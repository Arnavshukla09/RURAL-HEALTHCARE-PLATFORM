"use client"

/**
 * components/floating-chat/parts/ChatInputBar.tsx
 *
 * Chat input box with live suggestions chips and voice recognition toggle.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — AI Navigation Subsystem
 */

import { RefObject } from "react"
import { Send, Loader2, Mic, MicOff } from "lucide-react"
import type { SuggestionItem } from "@/lib/chat/suggestions"

interface ChatInputBarProps {
  en: boolean
  input: string
  setInput: (val: string) => void
  loading: boolean
  isListening: boolean
  toggleListen: () => void
  onSend: () => void
  suggestions: SuggestionItem[]
  setSuggestions: (s: SuggestionItem[]) => void
  inputRef: any
}

export function ChatInputBar({
  en,
  input,
  setInput,
  loading,
  isListening,
  toggleListen,
  onSend,
  suggestions,
  setSuggestions,
  inputRef,
}: ChatInputBarProps) {
  return (
    <div className="border-t border-gray-100 p-3 flex-shrink-0">
      {/* Live Suggestions Chips */}
      {suggestions.length > 0 && !loading && (
        <div
          className="flex flex-wrap gap-1.5 mb-2 max-h-20 overflow-y-auto"
          role="listbox"
          aria-label="Suggestions"
        >
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const textToSend = en ? item.queryEn : item.queryHi
                setInput(textToSend)
                setSuggestions([])
                setTimeout(() => onSend(), 50)
              }}
              className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-all text-left flex items-center gap-1 shadow-xs"
            >
              <span>💡</span>
              <span>{en ? item.textEn : item.textHi}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSuggestions([])
          onSend()
        }}
        className="flex items-center gap-2"
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? en ? "Listening..." : "सुन रहा हूँ..."
                : en
                ? "Ask or say 'go to appointments'..."
                : "पूछें या 'अपॉइंटमेंट पर जाएं'..."
            }
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100"
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleListen}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              isListening
                ? "text-red-500 bg-red-50 animate-pulse"
                : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
            }`}
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
  )
}
