"use client"

/**
 * components/dashboard/parts/WelcomeHeader.tsx
 *
 * User greeting banner with avatar, role description, and 1-tap SOS banner.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle } from "lucide-react"

interface WelcomeHeaderProps {
  user: any
  language: string
  welcomeText: string
}

export function WelcomeHeader({ user, language, welcomeText }: WelcomeHeaderProps) {
  const router = useRouter()

  const getInitials = (name: string) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-white">
            <AvatarImage src="" />
            <AvatarFallback className="bg-white text-blue-600 text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{welcomeText}</h1>
            <p className="text-blue-100">
              {user.role === "doctor" &&
                (language === "en" ? "Healthcare Provider" : "स्वास्थ्य सेवा प्रदाता")}
              {user.role === "patient" &&
                (language === "en" ? "Community Member" : "समुदाय सदस्य")}
              {user.role === "hospital" &&
                (language === "en" ? "Hospital Staff" : "अस्पताल कर्मचारी")}
              {user.role === "admin" &&
                (language === "en" ? "Administrator" : "प्रशासक")}
            </p>
            {user.location && (
              <div className="flex items-center mt-1 text-blue-100">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{user.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 1-Tap Emergency Alert Banner (Mobile-Optimized) */}
      <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="p-2.5 sm:p-3 bg-red-600 rounded-xl text-white flex-shrink-0 animate-pulse">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-red-900 text-sm sm:text-base leading-snug break-words">
              {language === "en"
                ? "Need Urgent Medical Help?"
                : "तत्काल चिकित्सा सहायता चाहिए?"}
            </h3>
            <p className="text-[11px] sm:text-xs text-red-700/90 mt-0.5 leading-tight line-clamp-2 sm:line-clamp-none">
              {language === "en"
                ? "1-Tap 108 Ambulance Call, Shake-to-SOS & Offline Chronic Health Vault"
                : "1-टैप 108 एम्बुलेंस कॉल, शेक एसओएस और ऑफ़लाइन स्वास्थ्य वॉल्ट"}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="lg"
          onClick={() => router.push("/emergency")}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold px-5 py-2.5 text-xs sm:text-sm text-white shadow-md flex-shrink-0 rounded-xl flex items-center justify-center"
        >
          <AlertCircle className="h-4 w-4 mr-2 animate-pulse flex-shrink-0" />
          <span>{language === "en" ? "Emergency SOS" : "आपातकालीन SOS"}</span>
        </Button>
      </div>
    </>
  )
}
