"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Heart, Gift } from "lucide-react"


interface DonationPortalProps {
  language: string
}

export function DonationPortal({ language }: DonationPortalProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState<number | null>(null)

  const donations = getProductsByCategory("donation")
  const selectedDonation = selectedProduct ? getProductById(selectedProduct) : null

  const handleCustomDonation = (amount: number) => {
    // Create a custom donation product ID
    setCustomAmount(amount)
    // Note: For custom amounts, you'd need to create a custom product or use a parameterized approach
    setSelectedProduct("donation-custom")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === "en" ? "Support Rural Healthcare" : "ग्रामीण स्वास्थ्य सेवा का समर्थन करें"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === "en"
              ? "Your contribution brings essential healthcare services to underserved rural communities"
              : "आपका योगदान वंचित ग्रामीण समुदायों को आवश्यक स्वास्थ्य सेवाएं प्रदान करता है"}
          </p>
        </div>

        {/* Main Content */}
        {selectedProduct ? (
          // Checkout View
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Complete Your Donation" : "अपना दान पूरा करें"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StripeCheckout
                    productId={selectedProduct}
                    metadata={{
                      donor_language: language,
                      donation_type: selectedDonation?.name || "custom",
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Donation Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{language === "en" ? "Donation Summary" : "दान सारांश"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{language === "en" ? "Donation Type" : "दान का प्रकार"}</p>
                    <p className="font-semibold">{selectedDonation?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{language === "en" ? "Amount" : "राशि"}</p>
                    <p className="font-semibold">${(selectedDonation?.priceInCents || 0) / 100}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {language === "en"
                        ? "100% of your donation supports rural healthcare initiatives"
                        : "100% आपका दान ग्रामीण स्वास्थ्य सेवा पहल में जाता है"}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setSelectedProduct(null)}>
                    {language === "en" ? "Choose Different Amount" : "अन्य राशि चुनें"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Donation Selection View
          <div className="grid md:grid-cols-2 gap-6">
            {donations.map((donation) => (
              <Card
                key={donation.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(donation.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{donation.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{donation.description}</p>
                    </div>
                    <Gift className="h-5 w-5 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold text-green-600">${(donation.priceInCents / 100).toFixed(2)}</div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      {language === "en"
                        ? "Impact: Provides healthcare services for 5 families"
                        : "प्रभाव: 5 परिवारों को स्वास्थ्य सेवाएं प्रदान करता है"}
                    </p>
                  </div>

                  <Button className="w-full">{language === "en" ? "Donate Now" : "अभी दान करें"}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Impact Section */}
        <div className="grid md:grid-cols-3 gap-6 bg-white p-6 rounded-lg border">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">2,450</div>
            <p className="text-gray-600">{language === "en" ? "Patients Served" : "रोगियों की सेवा की"}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">₹24.5L</div>
            <p className="text-gray-600">{language === "en" ? "Funds Raised" : "धन एकत्रित किया गया"}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">45</div>
            <p className="text-gray-600">{language === "en" ? "Health Camps" : "स्वास्थ्य शिविर"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
