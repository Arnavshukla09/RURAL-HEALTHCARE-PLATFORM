"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Video, Phone, MessageCircle } from "lucide-react"

interface ConsultationPortalProps {
  language: string
}

export function ConsultationPortal({ language }: ConsultationPortalProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const consultations = getProductsByCategory("consultation")
  const selectedConsultation = selectedProduct ? getProductById(selectedProduct) : null

  const getConsultationIcon = (id: string) => {
    if (id.includes("video")) return <Video className="h-5 w-5" />
    if (id.includes("audio")) return <Phone className="h-5 w-5" />
    return <MessageCircle className="h-5 w-5" />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === "en" ? "Online Consultations" : "ऑनलाइन परामर्श"}
          </h1>
          <p className="text-gray-600">
            {language === "en" ? "Connect with qualified healthcare professionals" : "योग्य स्वास्थ्य पेशेवरों से जुड़ें"}
          </p>
        </div>

        {/* Main Content */}
        {selectedProduct ? (
          // Checkout View
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Book Your Consultation" : "अपना परामर्श बुक करें"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StripeCheckout
                    productId={selectedProduct}
                    metadata={{
                      user_language: language,
                      consultation_type: selectedConsultation?.name || "unknown",
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Booking Details" : "बुकिंग विवरण"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{language === "en" ? "Consultation Type" : "परामर्श प्रकार"}</p>
                    <p className="font-semibold">{selectedConsultation?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{language === "en" ? "Fee" : "शुल्क"}</p>
                    <p className="font-semibold">${(selectedConsultation?.priceInCents || 0) / 100}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      {language === "en"
                        ? "You will receive appointment details after payment"
                        : "भुगतान के बाद आपको अपॉइंटमेंट विवरण मिलेगा"}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setSelectedProduct(null)}>
                    {language === "en" ? "Choose Different" : "अन्य चुनें"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Consultation Selection View
          <div className="grid md:grid-cols-3 gap-6">
            {consultations.map((consultation) => (
              <Card
                key={consultation.id}
                className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
                onClick={() => setSelectedProduct(consultation.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{consultation.name}</CardTitle>
                    <div className="text-blue-600">{getConsultationIcon(consultation.id)}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-600">{consultation.description}</p>

                  <div className="flex-1" />

                  <div className="text-2xl font-bold text-blue-600">
                    ${(consultation.priceInCents / 100).toFixed(2)}
                  </div>

                  <Button className="w-full">{language === "en" ? "Book Now" : "अभी बुक करें"}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-2xl font-bold mb-6">{language === "en" ? "How It Works" : "कैसे काम करता है"}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                en: "Select Consultation",
                hi: "परामर्श चुनें",
                icon: "1️⃣",
              },
              {
                en: "Complete Payment",
                hi: "भुगतान पूरा करें",
                icon: "2️⃣",
              },
              {
                en: "Receive Details",
                hi: "विवरण प्राप्त करें",
                icon: "3️⃣",
              },
              {
                en: "Attend Consultation",
                hi: "परामर्श में भाग लें",
                icon: "4️⃣",
              },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl mb-2">{step.icon}</div>
                <p className="font-medium">{language === "en" ? step.en : step.hi}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
