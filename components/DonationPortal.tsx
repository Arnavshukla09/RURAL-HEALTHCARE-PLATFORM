"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Heart } from "lucide-react"

interface DonationPortalProps {
  language: string
  user?: any
}

const donationAmounts = [100, 500, 1000, 2000, 5000]

export function DonationPortal({ language }: DonationPortalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState<number | null>(null)

  const t = {
    title: language === "hi" ? "दान पोर्टल" : "Donation Portal",
    subtitle: language === "hi" ? "ग्रामीण स्वास्थ्य सेवा का समर्थन करें" : "Support Rural Healthcare",
    custom: language === "hi" ? "कस्टम राशि" : "Custom Amount",
    donate: language === "hi" ? "दान करें" : "Donate",
    bankDetails: language === "hi" ? "बैंक विवरण" : "Bank Transfer Details",
    thankYou: language === "hi" ? "आपके समर्थन के लिए धन्यवाद" : "Thank you for your support",
  }

  const amount = customAmount || selectedAmount

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Heart className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {donationAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => { setSelectedAmount(amt); setCustomAmount(null) }}
            className={`border rounded-lg p-3 text-center font-medium transition-all ${
              selectedAmount === amt && !customAmount
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            ₹{amt}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">{t.custom} (₹)</label>
        <input
          type="number"
          className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-500"
          placeholder="Enter amount"
          onChange={(e) => {
            setCustomAmount(Number(e.target.value) || null)
            setSelectedAmount(null)
          }}
        />
      </div>

      {amount && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <p className="font-medium text-gray-700 mb-2">{t.bankDetails}:</p>
          <p className="text-sm text-gray-600">Account Name: Rural Healthcare Foundation</p>
          <p className="text-sm text-gray-600">Account No: 1234567890</p>
          <p className="text-sm text-gray-600">IFSC: SBIN0001234</p>
          <p className="text-sm text-gray-600">UPI: ruralhealth@upi</p>
          <p className="mt-2 text-blue-700 font-medium">Amount: ₹{amount}</p>
        </div>
      )}

      <Button
        className="w-full"
        disabled={!amount}
        onClick={() => alert(`Please transfer ₹${amount} using the bank details above. Thank you!`)}
      >
        {t.donate} {amount ? `₹${amount}` : ""}
      </Button>

      <p className="text-center text-sm text-gray-400 mt-4">{t.thankYou}</p>
    </div>
  )
}
