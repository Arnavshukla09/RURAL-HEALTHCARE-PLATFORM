"use client"

/**
 * components/patient-records/parts/VitalsCard.tsx
 *
 * Patient Vitals overview card (BP, temperature, pulse, glucose, SpO2, weight).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Records Subsystem
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Heart, Thermometer, Droplets, Eye, Stethoscope } from 'lucide-react'

interface VitalsCardProps {
  en: boolean
  healthData: any[]
  formatDate: (d: string) => string
}

export function VitalsCard({ en, healthData, formatDate }: VitalsCardProps) {
  if (!healthData || healthData.length === 0) return null

  const latest = healthData[0]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          {en ? 'Latest Vitals' : 'नवीनतम संकेत'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {latest?.blood_pressure && (
            <div className="bg-red-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-red-700">{en ? 'BP' : 'रक्तचाप'}</span>
              </div>
              <p className="text-lg font-bold text-red-900">{latest.blood_pressure}</p>
            </div>
          )}
          {latest?.temperature && (
            <div className="bg-orange-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">{en ? 'Temp' : 'तापमान'}</span>
              </div>
              <p className="text-lg font-bold text-orange-900">{latest.temperature}°F</p>
            </div>
          )}
          {latest?.pulse_rate && (
            <div className="bg-pink-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-4 w-4 text-pink-500" />
                <span className="text-xs font-medium text-pink-700">{en ? 'Pulse' : 'नाड़ी'}</span>
              </div>
              <p className="text-lg font-bold text-pink-900">{latest.pulse_rate} bpm</p>
            </div>
          )}
          {latest?.blood_sugar && (
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">{en ? 'Sugar' : 'शर्करा'}</span>
              </div>
              <p className="text-lg font-bold text-amber-900">{latest.blood_sugar}</p>
            </div>
          )}
          {latest?.spo2 && (
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-700">SpO₂</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{latest.spo2}%</p>
            </div>
          )}
          {latest?.weight && (
            <div className="bg-green-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Stethoscope className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-700">{en ? 'Weight' : 'वजन'}</span>
              </div>
              <p className="text-lg font-bold text-green-900">{latest.weight} kg</p>
            </div>
          )}
        </div>
        {latest?.recorded_at && (
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {en ? 'Last recorded' : 'अंतिम रिकॉर्ड'}: {formatDate(latest.recorded_at)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
