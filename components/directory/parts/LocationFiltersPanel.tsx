"use client"

/**
 * components/directory/parts/LocationFiltersPanel.tsx
 *
 * Mutual exclusivity location filter: GPS radius vs State/District hierarchy.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { Button } from "@/components/ui/button"
import { Navigation, Building2, Lock } from "lucide-react"
import { SearchableDropdown } from "./SearchableDropdown"

interface LocationFiltersPanelProps {
  language: string
  t: any
  isGpsActive: boolean
  isStateActive: boolean
  userCoords: { lat: number; lng: number } | null
  setUserCoords: (coords: { lat: number; lng: number } | null) => void
  selectedRadius: number
  setSelectedRadius: (rad: number) => void
  isLocating: boolean
  handleDetectLocation: () => void
  setLocationStatus: (s: string | null) => void
  selectedStateCode: string
  setSelectedStateCode: (code: string) => void
  selectedDistrictName: string
  setSelectedDistrictName: (name: string) => void
  stateOptions: Array<{ code: string; nameEn: string; nameHi: string }>
  districtOptions: Array<{ code: string; nameEn: string; nameHi: string }>
}

export function LocationFiltersPanel({
  language,
  t,
  isGpsActive,
  isStateActive,
  userCoords,
  setUserCoords,
  selectedRadius,
  setSelectedRadius,
  isLocating,
  handleDetectLocation,
  setLocationStatus,
  selectedStateCode,
  setSelectedStateCode,
  selectedDistrictName,
  setSelectedDistrictName,
  stateOptions,
  districtOptions,
}: LocationFiltersPanelProps) {
  return (
    <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in-50 duration-150">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option A: Live GPS */}
        <div
          className={`p-4 rounded-xl border transition-all relative ${
            isGpsActive
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-100 shadow-xs"
              : isStateActive
                ? "bg-gray-100/70 border-gray-200 opacity-40 pointer-events-none select-none"
                : "bg-white border-gray-200 shadow-2xs"
          }`}
        >
          {isStateActive && (
            <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[0.5px] rounded-xl z-10 flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>{language === "hi" ? "राज्य फ़िल्टर सक्रिय होने के कारण GPS बंद है" : "GPS locked while State/District is chosen"}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedStateCode("all")
                  setSelectedDistrictName("all")
                }}
                className="h-7 text-xs font-bold text-blue-700 border-blue-300 bg-white hover:bg-blue-50 shadow-2xs"
              >
                {language === "hi" ? "राज्य फ़िल्टर हटाएं" : "Clear State to Use GPS"}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isGpsActive ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <Navigation className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">{language === "hi" ? "विकल्प A: डिवाइस GPS एवं निकटता" : "Option A: Device GPS & Proximity"}</h4>
                <p className="text-[11px] text-gray-500">{language === "hi" ? "निकटतम डॉक्टरों के लिए GPS दूरी" : "Live distance radius from your coordinates"}</p>
              </div>
            </div>
            {isGpsActive && (
              <button onClick={() => { setUserCoords(null); setLocationStatus(null); }} className="text-[11px] font-bold text-red-600 hover:underline">
                {language === "hi" ? "GPS हटाएं" : "Clear GPS"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Button
              variant={isGpsActive ? "default" : "outline"}
              onClick={handleDetectLocation}
              disabled={isLocating || isStateActive}
              className={`w-full h-10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 ${
                isGpsActive ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white"
              }`}
            >
              <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} />
              <span>
                {isLocating
                  ? language === "hi" ? "स्थान खोज रहे हैं..." : "Detecting GPS..."
                  : isGpsActive
                    ? language === "hi" ? "✓ GPS सक्रिय है (पुनः स्कैन करें)" : "✓ GPS Active (Click to re-scan)"
                    : language === "hi" ? "मेरा GPS सक्रिय करें" : "Use My Live GPS"}
              </span>
            </Button>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.radius}</label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isGpsActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                  {selectedRadius} km
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 25, 50, 100].map((rad) => (
                  <button
                    key={rad}
                    disabled={!isGpsActive}
                    onClick={() => setSelectedRadius(rad)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      selectedRadius === rad && isGpsActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    }`}
                  >
                    {rad} km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Option B: State & District Hierarchy */}
        <div
          className={`p-4 rounded-xl border transition-all relative ${
            isStateActive
              ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-100 shadow-xs"
              : isGpsActive
                ? "bg-gray-100/70 border-gray-200 opacity-40 pointer-events-none select-none"
                : "bg-white border-gray-200 shadow-2xs"
          }`}
        >
          {isGpsActive && (
            <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[0.5px] rounded-xl z-10 flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>{language === "hi" ? "GPS चालू होने के कारण राज्य/जिला चयन बंद है" : "State & District locked while GPS is active"}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setUserCoords(null); setLocationStatus(null); }}
                className="h-7 text-xs font-bold text-emerald-700 border-emerald-300 bg-white hover:bg-emerald-50 shadow-2xs"
              >
                {language === "hi" ? "GPS बंद करें" : "Clear GPS to Select State"}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isStateActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">{language === "hi" ? "विकल्प B: राज्य एवं ज़िला चुनें" : "Option B: Select State & District"}</h4>
                <p className="text-[11px] text-gray-500">{language === "hi" ? "संपूर्ण राज्य/ज़िला डॉक्टर सूची देखें" : "Browse full verified doctors catalog"}</p>
              </div>
            </div>
            {isStateActive && (
              <button
                onClick={() => { setSelectedStateCode("all"); setSelectedDistrictName("all"); }}
                className="text-[11px] font-bold text-red-600 hover:underline"
              >
                {language === "hi" ? "हटाएं" : "Clear State"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <SearchableDropdown
              label={t.stateFilter}
              placeholder={language === "hi" ? "राज्य चुनें (सभी राज्य)" : "Select State (All States)"}
              searchPlaceholder={language === "hi" ? "राज्य खोजें..." : "Type to search state..."}
              selectedCode={selectedStateCode}
              options={stateOptions}
              onSelect={(code) => { setSelectedStateCode(code); setSelectedDistrictName("all"); }}
              disabled={isGpsActive}
              disabledMessage="Clear GPS first"
              language={language}
              allOptionLabel={t.allStates}
            />

            <SearchableDropdown
              label={t.districtFilter}
              placeholder={
                selectedStateCode === "all"
                  ? language === "hi" ? "पहले राज्य चुनें" : "Select State first"
                  : language === "hi" ? "ज़िला चुनें (सभी ज़िले)" : "Select District (All Districts)"
              }
              searchPlaceholder={language === "hi" ? "ज़िला खोजें..." : "Type to search district..."}
              selectedCode={selectedDistrictName}
              options={districtOptions}
              onSelect={(nameEn) => setSelectedDistrictName(nameEn)}
              disabled={isGpsActive || selectedStateCode === "all"}
              disabledMessage={isGpsActive ? "Clear GPS first" : "Select State first"}
              language={language}
              allOptionLabel={t.allDistricts}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
