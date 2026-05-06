"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Phone, MapPin, Share2, AlertTriangle, Truck } from "lucide-react"

interface EmergencyModuleProps {
  setCurrentPage: (page: string) => void
  language: string
}

export function EmergencyModule({ setCurrentPage, language }: EmergencyModuleProps) {
  const content = {
    en: {
      title: "Emergency Services",
      subtitle: "Get immediate medical assistance",
      call108: "Call 108 - Ambulance",
      findHospital: "Find Nearest Hospital",
      shareLocation: "Share My Location",
      emergencyContacts: "Emergency Contacts",
      ambulance: "Ambulance",
      police: "Police",
      fire: "Fire Department",
      instructions: "Emergency Instructions",
      steps: [
        "Stay calm and assess the situation",
        "Call emergency services immediately",
        "Provide clear location details",
        "Follow operator instructions",
        "Do not move injured person unless necessary",
      ],
    },
    hi: {
      title: "आपातकालीन सेवाएं",
      subtitle: "तत्काल चिकित्सा सहायता प्राप्त करें",
      call108: "108 पर कॉल करें - एम्बुलेंस",
      findHospital: "निकटतम अस्पताल खोजें",
      shareLocation: "मेरा स्थान साझा करें",
      emergencyContacts: "आपातकालीन संपर्क",
      ambulance: "एम्बुलेंस",
      police: "पुलिस",
      fire: "अग्निशमन विभाग",
      instructions: "आपातकालीन निर्देश",
      steps: [
        "शांत रहें और स्थिति का आकलन करें",
        "आपातकालीन सेवाओं को तुरंत कॉल करें",
        "स्पष्ट स्थान विवरण प्रदान करें",
        "ऑपरेटर के निर्देशों का पालन करें",
        "आवश्यक न होने पर घायल व्यक्ति को न हिलाएं",
      ],
    },
  }

  const t = content[language as keyof typeof content] || content.en

  const emergencyNumbers = [
    { service: t.ambulance, number: "108", icon: Truck, color: "red" },
    { service: t.police, number: "100", icon: AlertTriangle, color: "blue" },
    { service: t.fire, number: "101", icon: AlertTriangle, color: "orange" },
  ]

  return (
    <div className="min-h-screen bg-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Main Emergency Call */}
        <Card className="border-red-200 bg-white">
          <CardContent className="p-8 space-y-6">
            <Button
              onClick={() => window.open("tel:108")}
              className="w-full h-24 text-2xl bg-red-600 hover:bg-red-700 animate-pulse"
            >
              <Phone className="mr-2 h-8 w-8" />
              {t.call108}
            </Button>

            <div className="grid md:grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-20 bg-transparent"
                onClick={() => setCurrentPage("locations")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t.findHospital}
              </Button>
              <Button size="lg" variant="outline" className="h-20 bg-transparent">
                <Share2 className="mr-2 h-5 w-5" />
                {t.shareLocation}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Emergency Contacts */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                {t.emergencyContacts}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyNumbers.map((contact, idx) => {
                const Icon = contact.icon
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 text-${contact.color}-600`} />
                      <span className="font-medium">{contact.service}</span>
                    </div>
                    <Button size="sm" onClick={() => window.open(`tel:${contact.number}`)} className="font-bold">
                      {contact.number}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Emergency Instructions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-primary" />
                {t.instructions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {t.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
