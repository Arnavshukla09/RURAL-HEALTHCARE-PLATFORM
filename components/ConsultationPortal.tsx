"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Video, Phone, MessageCircle } from "lucide-react"

interface ConsultationPortalProps {
  language: string
  user?: any
  setCurrentPage?: (page: string) => void
}

const consultations = [
  { id: "video", label: "Video Consultation", labelHi: "वीडियो परामर्श", icon: Video, price: "Free", desc: "Face-to-face video call with doctor" },
  { id: "audio", label: "Audio Consultation", labelHi: "ऑडियो परामर्श", icon: Phone, price: "Free", desc: "Voice call with doctor" },
  { id: "chat", label: "Chat Consultation", labelHi: "चैट परामर्श", icon: MessageCircle, price: "Free", desc: "Text chat with doctor" },
]

export function ConsultationPortal({ language, user, setCurrentPage }: ConsultationPortalProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)

  const t = {
    title: language === "hi" ? "परामर्श पोर्टल" : "Consultation Portal",
    subtitle: language === "hi" ? "डॉक्टर से जुड़ें" : "Connect with a Doctor",
    book: language === "hi" ? "बुक करें" : "Book Now",
    free: language === "hi" ? "निःशुल्क" : "Free",
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
      <p className="text-gray-500 mb-6">{t.subtitle}</p>

      <div className="grid gap-4">
        {consultations.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedProduct === item.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => setSelectedProduct(item.id)}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">
                    {language === "hi" ? item.labelHi : item.label}
                  </p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <span className="text-green-600 font-medium">{t.free}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selectedProduct && (
        <Button className="w-full mt-6" onClick={() => alert("Booking feature coming soon!")}>
          {t.book}
        </Button>
      )}
    </div>
  )
}
