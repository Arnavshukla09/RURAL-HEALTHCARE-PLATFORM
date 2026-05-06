"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { JitsiMeeting } from "./JitsiMeeting"
import { generateRoomName } from "@/lib/jitsi/config"
import { Video, X } from "lucide-react"

interface TeleconsultationModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  patientName: string
  providerName: string
  language?: string
}

export function TeleconsultationModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  providerName,
  language = "en",
}: TeleconsultationModalProps) {
  const [roomStarted, setRoomStarted] = useState(false)
  const [roomName] = useState(() => generateRoomName())

  const content = {
    en: {
      title: "Video Consultation",
      description: "Connect with your healthcare provider",
      startBtn: "Start Video Call",
      joining: "Patient",
      provider: "Provider",
    },
    hi: {
      title: "वीडियो परामर्श",
      description: "अपने स्वास्थ्य सेवा प्रदाता से जुड़ें",
      startBtn: "वीडियो कॉल शुरू करें",
      joining: "रोगी",
      provider: "प्रदाता",
    },
  }

  const t = content[language as keyof typeof content]

  const handleStartCall = () => {
    setRoomStarted(true)
    // Log to API for future reference
    fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: appointmentId,
        teleconsult_room_id: roomName,
        status: "in-progress",
      }),
    }).catch(console.error)
  }

  const handleLeave = () => {
    setRoomStarted(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {!roomStarted ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-sm mb-2">{t.joining}</p>
                <p className="text-gray-700">{patientName}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-sm mb-2">{t.provider}</p>
                <p className="text-gray-700">{providerName}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleStartCall} size="lg" className="flex-1">
                <Video className="h-4 w-4 mr-2" />
                {t.startBtn}
              </Button>
              <Button onClick={onClose} variant="outline" size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <JitsiMeeting roomName={roomName} displayName={patientName} onLeave={handleLeave} language={language} />
        )}
      </DialogContent>
    </Dialog>
  )
}
