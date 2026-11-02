"use client"

/**
 * components/floating-chat/parts/ChatMessageItem.tsx
 *
 * Message bubble with read-aloud voice playback, feedback voting, and action navigation buttons.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — AI Navigation Subsystem
 */

import { User, Bot, Volume2, ThumbsUp, ThumbsDown } from "lucide-react"
import type { ChatMessage, NavButton } from "../types"

interface ChatMessageItemProps {
  msg: ChatMessage
  idx: number
  en: boolean
  speakingMsgIdx: number | null
  onToggleSpeak: (idx: number, text: string) => void
  onFeedback: (idx: number, queryId: string, isUp: boolean) => void
  onButtonClick: (btn: NavButton) => void
}

export function ChatMessageItem({
  msg,
  idx,
  en,
  speakingMsgIdx,
  onToggleSpeak,
  onFeedback,
  onButtonClick,
}: ChatMessageItemProps) {
  const isUser = msg.role === "user"

  return (
    <div>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`flex items-start gap-2 max-w-[88%] ${isUser ? "flex-row-reverse" : ""}`}>
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          </div>
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "bg-teal-600 text-white rounded-tr-sm"
                : "bg-gray-100 text-gray-800 rounded-tl-sm"
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {!isUser && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50 justify-between">
                <button
                  onClick={() => onToggleSpeak(idx, msg.content)}
                  className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                    speakingMsgIdx === idx ? "text-teal-600 bg-teal-50" : "text-gray-500"
                  }`}
                  title={
                    speakingMsgIdx === idx
                      ? en ? "Stop speaking" : "बोलना बंद करें"
                      : en ? "Read aloud" : "जोर से पढ़ें"
                  }
                >
                  <Volume2
                    className={`h-3.5 w-3.5 ${speakingMsgIdx === idx ? "animate-pulse" : ""}`}
                  />
                </button>

                {msg.queryId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onFeedback(idx, msg.queryId!, true)}
                      disabled={msg.feedback !== undefined}
                      className={`p-1.5 rounded transition-colors ${
                        msg.feedback === 1
                          ? "text-teal-600 bg-teal-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onFeedback(idx, msg.queryId!, false)}
                      disabled={msg.feedback !== undefined}
                      className={`p-1.5 rounded transition-colors ${
                        msg.feedback === -1
                          ? "text-red-500 bg-red-50"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                      }`}
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

      {/* Navigation buttons */}
      {msg.navButtons && msg.navButtons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
          {msg.navButtons.map((btn, bi) => (
            <button
              key={bi}
              onClick={() => onButtonClick(btn)}
              className="text-xs bg-white text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-50 hover:border-teal-400 transition-all shadow-sm font-medium"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
