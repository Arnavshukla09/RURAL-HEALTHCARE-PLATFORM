"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Phone, MapPin, Share2, AlertTriangle, Truck, MessageSquare, MessageCircle, Activity, BookOpen } from "lucide-react"

interface EmergencyModuleProps {
  setCurrentPage: (page: string) => void
  language: string
}

const firstAidItems = [
  { icon: "🩹", titleEn: "Cuts & Wounds",       titleHi: "कट और घाव",         color: "border-orange-400 bg-orange-50",  iconBg: "bg-orange-100" },
  { icon: "🔥", titleEn: "Burns",                titleHi: "जलना",              color: "border-red-400 bg-red-50",        iconBg: "bg-red-100"    },
  { icon: "🐍", titleEn: "Snake Bite",            titleHi: "सांप काटना",        color: "border-green-500 bg-green-50",    iconBg: "bg-green-100"  },
  { icon: "😮", titleEn: "Choking",               titleHi: "गला घुटना",         color: "border-purple-400 bg-purple-50",  iconBg: "bg-purple-100" },
  { icon: "❤️", titleEn: "Heart Attack",          titleHi: "दिल का दौरा",       color: "border-rose-500 bg-rose-50",      iconBg: "bg-rose-100"   },
  { icon: "🌡️", titleEn: "High Fever",            titleHi: "तेज बुखार",         color: "border-amber-400 bg-amber-50",    iconBg: "bg-amber-100"  },
  { icon: "💧", titleEn: "Dehydration",           titleHi: "निर्जलीकरण",        color: "border-blue-400 bg-blue-50",      iconBg: "bg-blue-100"   },
  { icon: "⚡", titleEn: "Electric Shock",         titleHi: "बिजली का झटका",     color: "border-yellow-500 bg-yellow-50",  iconBg: "bg-yellow-100" },
]

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
      smsFallback: "SMS Emergency SOS",
      waFallback: "WhatsApp SOS",
      firstAid: "Visual First-Aid Guide",
      firstAidSub: "Tap any card for full step-by-step instructions →",
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
      smsFallback: "एसएमएस आपातकालीन एसओएस",
      waFallback: "व्हाट्सएप एसओएस",
      firstAid: "प्राथमिक चिकित्सा दृश्य मार्गदर्शिका",
      firstAidSub: "पूर्ण चरण-दर-चरण निर्देश के लिए किसी कार्ड पर टैप करें →",
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
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => window.open("sms:108?body=EMERGENCY! I need immediate maternal health assistance at my location.")}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t.smsFallback}
              </Button>
              <Button
                variant="outline"
                className="w-full border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => window.open("https://wa.me/91108?text=EMERGENCY!%20I%20need%20immediate%20maternal%20health%20assistance.")}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t.waFallback}
              </Button>
            </div>

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
              <Button size="lg" variant="outline" className="h-20 bg-transparent"
                onClick={() => {
                  if (!navigator.geolocation) {
                    alert(language === 'en' ? 'Geolocation not supported by your browser' : 'आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता')
                    return
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
                      navigator.clipboard.writeText(url).then(() => {
                        alert(language === 'en' ? 'Location link copied to clipboard! Share it with emergency contacts.' : 'लोकेशन लिंक कॉपी हो गया! आपातकालीन संपर्कों के साथ साझा करें।')
                      }).catch(() => {
                        prompt(language === 'en' ? 'Copy this location link:' : 'यह लिंक कॉपी करें:', url)
                      })
                    },
                    () => alert(language === 'en' ? 'Location access denied' : 'लोकेशन अनुमति अस्वीकृत')
                  )
                }}
              >
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

        {/* Visual First-Aid Guide — Each card navigates to Health Info Hub */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Activity className="h-6 w-6 mr-2" />
              {t.firstAid}
            </CardTitle>
            <p className="text-sm text-orange-600 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {t.firstAidSub}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {firstAidItems.map((item) => (
                <button
                  key={item.titleEn}
                  onClick={() => setCurrentPage("health-info")}
                  className={`${item.color} border-t-4 p-4 rounded-xl shadow-sm text-center transition-all hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer`}
                >
                  <div className={`${item.iconBg} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl`}>
                    {item.icon}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm leading-tight">
                    {language === "hi" ? item.titleHi : item.titleEn}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
