"use client"

/**
 * components/dashboard/parts/SchemesPreview.tsx
 *
 * Government healthcare benefits and cash incentive cards (JSSK & JSY).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Heart, IndianRupee } from "lucide-react"

interface SchemesPreviewProps {
  language: string
}

export function SchemesPreview({ language }: SchemesPreviewProps) {
  const router = useRouter()

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center text-green-800">
          <ShieldCheck className="h-5 w-5 mr-2" />
          {language === "en"
            ? "Government Schemes & Support"
            : "सरकारी योजनाएं एवं सहायता"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <h4 className="font-bold text-green-700 mb-2">JSSK (Free Delivery)</h4>
          <ul className="text-sm space-y-2 text-gray-700">
            <li className="flex items-start">
              <Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              100% Free delivery & C-Section
            </li>
            <li className="flex items-start">
              <Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              Free drugs and consumables
            </li>
            <li className="flex items-start">
              <Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              Free diet during stay
            </li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <h4 className="font-bold text-green-700 mb-2">JSY (Cash Incentive)</h4>
          <ul className="text-sm space-y-2 text-gray-700">
            <li className="flex items-start">
              <IndianRupee className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              ₹1400 for Rural Mothers
            </li>
            <li className="flex items-start">
              <IndianRupee className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              ₹1000 for Urban Mothers
            </li>
            <li className="flex items-start">
              <Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
              Promotes institutional delivery
            </li>
          </ul>
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <Button
          variant="outline"
          className="w-full text-green-700 border-green-200 hover:bg-green-100"
          onClick={() => router.push("/health-info/schemes")}
        >
          {language === "en"
            ? "View All Government Schemes"
            : "सभी सरकारी योजनाएं देखें"}
        </Button>
      </div>
    </Card>
  )
}
