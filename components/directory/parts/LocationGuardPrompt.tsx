"use client"

/**
 * components/directory/parts/LocationGuardPrompt.tsx
 *
 * Location Guard prompt displayed when neither GPS nor State is selected.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation, Building2 } from "lucide-react"

interface LocationGuardPromptProps {
  language: string
  t: any
  isLocating: boolean
  onDetectLocation: () => void
  onOpenFilterMenu: () => void
  onSelectState: (stateCode: string) => void
}

export function LocationGuardPrompt({
  language,
  t,
  isLocating,
  onDetectLocation,
  onOpenFilterMenu,
  onSelectState,
}: LocationGuardPromptProps) {
  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30 text-center py-12 px-4 rounded-2xl">
      <CardContent className="max-w-md mx-auto space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
          <Navigation className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900">
            {language === "hi" ? "पास के डॉक्टर खोजने हेतु स्थान निर्धारित करें" : "Set Your Location to Find Nearby Doctors"}
          </h3>
          <p className="text-xs text-gray-600">
            {language === "hi"
              ? "डॉक्टर खोज पूरी तरह से निकटता-आधारित है। सभी डॉक्टरों को एक साथ देखने का विकल्प उपलब्ध नहीं है; कृपया अपना GPS सक्रिय करें या राज्य और जिला चुनें।"
              : "Doctor listings are strictly proximity-filtered within your chosen radius (capping top 10 per specialist). Search using universal search, activate GPS, or select your State."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button
            onClick={onDetectLocation}
            disabled={isLocating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 px-5 rounded-xl flex items-center justify-center gap-2"
          >
            <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? t.detectingLocation : "📍 Use My GPS Location"}</span>
          </Button>
          <Button
            onClick={onOpenFilterMenu}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-1.5"
          >
            <Building2 className="h-4 w-4" />
            <span>{language === "hi" ? "राज्य एवं ज़िला चुनें" : "Select State & District"}</span>
          </Button>
        </div>

        {/* Quick State Selection Pills */}
        <div className="pt-4 border-t border-blue-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {language === "hi" ? "या लोकप्रिय राज्य चुनें:" : "Or select popular state:"}
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              { code: "23", name: "Madhya Pradesh" },
              { code: "07", name: "Delhi" },
              { code: "09", name: "Uttar Pradesh" },
              { code: "27", name: "Maharashtra" },
              { code: "08", name: "Rajasthan" },
              { code: "29", name: "Karnataka" },
            ].map((s) => (
              <button
                key={s.code}
                onClick={() => onSelectState(s.code)}
                className="px-2.5 py-1 text-xs bg-white text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium transition"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
