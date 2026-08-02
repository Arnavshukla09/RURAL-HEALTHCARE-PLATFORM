"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Phone, MapPin, Share2, AlertTriangle, Truck, MessageSquare, MessageCircle, BookOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface EmergencyModuleProps {
  language: string
}


export function EmergencyModule({ language }: EmergencyModuleProps) {
  const router = useRouter();
  const content = {
    en: {
      title: "Emergency Services",
      subtitle: "Get immediate medical assistance",
      call108: "Call 108 - Ambulance",
      findHospital: "Find Nearest Hospital",
      shareLocation: "Share My Location",
      emergencyContacts: "Helpline",
      ambulance: "Ambulance",
      police: "Police Helpline- DIAL100",
      fire: "Fire Emergency",
      cmHelpline: "CM Helpline",
      childHelpline: "Child Helpline",
      womenHelpline: "Women Helpline",
      ayushman: "Ayushman Bharat Helpline",
      nationalHealth: "National Health Helpline (NHP)",
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
      firstAid: "First-Aid Guide",
      firstAidSub: "Tap any card for full step-by-step instructions →",
    },
    hi: {
      title: "आपातकालीन सेवाएं",
      subtitle: "तत्काल चिकित्सा सहायता प्राप्त करें",
      call108: "108 पर कॉल करें - एम्बुलेंस",
      findHospital: "निकटतम अस्पताल खोजें",
      shareLocation: "मेरा स्थान साझा करें",
      emergencyContacts: "हेल्पलाइन",
      ambulance: "एम्बुलेंस",
      police: "पुलिस हेल्पलाइन- 100",
      fire: "अग्निशमन आपातकाल",
      cmHelpline: "सीएम हेल्पलाइन",
      childHelpline: "चाइल्ड हेल्पलाइन",
      womenHelpline: "महिला हेल्पलाइन",
      ayushman: "आयुष्मान भारत हेल्पलाइन",
      nationalHealth: "राष्ट्रीय स्वास्थ्य हेल्पलाइन",
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
  const { toast } = useToast()

  const emergencyNumbers = [
    { service: t.cmHelpline, number: "181", icon: Phone, color: "gray" },
    { service: t.childHelpline, number: "1098", icon: Phone, color: "gray" },
    { service: t.police, number: "100", icon: AlertTriangle, color: "blue" },
    { service: t.fire, number: "101", icon: AlertTriangle, color: "orange" },
    { service: t.ambulance, number: "108", icon: Truck, color: "red" },
    { service: t.womenHelpline, number: "1090", icon: Phone, color: "gray" },
    { service: t.ayushman, number: "18002332085", icon: Phone, color: "teal" },
    { service: t.nationalHealth, number: "18001801104", icon: Phone, color: "teal" },
  ]

  const shareLocationViaWhatsApp = () => {
    if (!navigator.geolocation) {
      window.open("https://wa.me/?text=EMERGENCY!%20I%20need%20immediate%20medical%20assistance.");
      return;
    }
    toast({ title: language === 'en' ? 'Fetching location...' : 'लोकेशन प्राप्त कर रहा है...' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const message = `EMERGENCY! I need immediate medical assistance. My location: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
      },
      () => {
        window.open("https://wa.me/?text=EMERGENCY!%20I%20need%20immediate%20medical%20assistance.");
        toast({ title: language === 'en' ? 'Could not fetch location' : 'लोकेशन प्राप्त नहीं किया जा सका', variant: "destructive" });
      }
    );
  };

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
                onClick={() => window.open("sms:112?body=EMERGENCY! I need immediate medical assistance at my location.")}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t.smsFallback}
              </Button>
              <Button
                variant="outline"
                className="w-full border-green-200 text-green-600 hover:bg-green-50"
                onClick={shareLocationViaWhatsApp}
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
                onClick={() => router.push("/locations")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t.findHospital}
              </Button>
              <Button size="lg" variant="outline" className="h-20 bg-transparent"
                onClick={() => {
                      if (!navigator.geolocation) {
                    toast({ title: language === 'en' ? 'Geolocation not supported by your browser' : 'आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता', variant: "destructive" })
                    return
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
                      navigator.clipboard.writeText(url).then(() => {
                        toast({ title: language === 'en' ? 'Location link copied to clipboard! Share it with emergency contacts.' : 'लोकेशन लिंक कॉपी हो गया! आपातकालीन संपर्कों के साथ साझा करें।' })
                      }).catch(() => {
                        prompt(language === 'en' ? 'Copy this location link:' : 'यह लिंक कॉपी करें:', url)
                      })
                    },
                    () => toast({ title: language === 'en' ? 'Location access denied' : 'लोकेशन अनुमति अस्वीकृत', variant: "destructive" })
                  )
                }}
              >
                <Share2 className="mr-2 h-5 w-5" />
                {t.shareLocation}
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-20 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 mt-4"
              onClick={() => router.push("/health-info")}
            >
              <div className="flex flex-col items-center">
                <span className="flex items-center text-lg font-semibold"><BookOpen className="mr-2 h-5 w-5" /> {t.firstAid}</span>
                <span className="text-xs text-blue-500 font-normal mt-1">{t.firstAidSub}</span>
              </div>
            </Button>
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
                    onClick={() => window.open(`tel:${contact.number}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 text-${contact.color}-600`} />
                      <span className="font-medium">{contact.service}</span>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); window.open(`tel:${contact.number}`); }} className="font-bold">
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
