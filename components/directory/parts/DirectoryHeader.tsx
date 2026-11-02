"use client"

/**
 * components/directory/parts/DirectoryHeader.tsx
 *
 * Header and Facility Map banner for Directory component.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Directory Subsystem
 */

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, MapPin, ArrowRight } from "lucide-react"

interface DirectoryHeaderProps {
  language: string
  title: string
}

export function DirectoryHeader({ language, title }: DirectoryHeaderProps) {
  const router = useRouter()

  return (
    <>
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {language === "hi"
              ? "सत्यापित चिकित्सक एवं स्वास्थ्य सुविधा निर्देशिका"
              : "Clinician & Facility Directory • Radius-Scoped"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-600">
          {language === "hi"
            ? "आपके वर्तमान स्थान या चयनित जिले के 10-100 किमी के दायरे में प्रति विशेषज्ञता शीर्ष 10 डॉक्टर।"
            : "Locate verified doctors strictly within your radius — capped to top 10 specialists per category."}
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {language === "hi" ? "अस्पताल, PHC और CHC खोज रहे हैं?" : "Looking for Hospitals, PHCs, CHCs & 24/7 Trauma Centers?"}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {language === "hi"
                ? "सभी 1,36,000+ सरकारी स्वास्थ्य केंद्र, बिस्तर उपलब्धता और फोन नंबर हमारे सुविधा मानचित्र पर देखें।"
                : "All 136,000+ public hospitals with verified direct phone numbers are mapped on our interactive Facility Map."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/locations")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 flex items-center gap-1.5 shadow-xs"
        >
          <span>{language === "hi" ? "सुविधा मानचित्र खोलें" : "Open Facility Map"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  )
}
