"use client"

/**
 * components/health-info-hub/parts/AwarenessTab.tsx
 *
 * Public health awareness modules (Clean Water, Nutrition, Maternal, Child Health, Hygiene).
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Clinical Education Subsystem
 */

import { Card, CardContent } from "@/components/ui/card"

interface AwarenessTabProps {
  en: boolean
  search: string
}

export function AwarenessTab({ en, search }: AwarenessTabProps) {
  const items = [
    {
      icon: "🚰",
      title: "Clean Water",
      hi: "स्वच्छ पानी",
      body: "Always boil or filter drinking water. Use ORS for diarrhea. Wash hands before eating.",
      hiBody: "पीने के पानी को हमेशा उबालें या फिल्टर करें। दस्त के लिए ORS का उपयोग करें। खाने से पहले हाथ धोएं।",
    },
    {
      icon: "🥗",
      title: "Nutrition",
      hi: "पोषण",
      body: "Eat iron-rich foods (spinach, beans). Include fruits daily. Breastfeed infants for 6 months.",
      hiBody: "आयरन युक्त खाद्य पदार्थ (पालक, बीन्स) खाएं। प्रतिदिन फलों को शामिल करें। 6 महीने तक शिशुओं को स्तनपान कराएं।",
    },
    {
      icon: "🤱",
      title: "Maternal Health",
      hi: "मातृ स्वास्थ्य",
      body: "4+ ANC checkups during pregnancy. Institutional delivery recommended. Take iron & folic acid.",
      hiBody: "गर्भावस्था के दौरान 4+ एएनसी जांच। संस्थागत प्रसव (Institutional delivery) की सलाह दी जाती है। आयरन और फोलिक एसिड लें।",
    },
    {
      icon: "👶",
      title: "Child Health",
      hi: "बाल स्वास्थ्य",
      body: "Complete all vaccinations. Monitor growth with weight chart. Seek help for fever in infants.",
      hiBody: "सभी टीकाकरण पूरे करें। वजन चार्ट से विकास की निगरानी करें। शिशुओं में बुखार होने पर मदद लें।",
    },
    {
      icon: "🧼",
      title: "Hygiene",
      hi: "स्वच्छता",
      body: "Wash hands with soap 20+ seconds. Use clean toilets. Keep surroundings clean.",
      hiBody: "साबुन से 20+ सेकंड तक हाथ धोएं। साफ शौचालयों का उपयोग करें। आसपास सफाई रखें।",
    },
    {
      icon: "🩺",
      title: "Regular Checkups",
      hi: "नियमित जांच",
      body: "Annual health checkup for adults. BP & sugar test after 40.",
      hiBody: "वयस्कों के लिए वार्षिक स्वास्थ्य जांच। 40 के बाद बीपी और शुगर की जांच।",
    },
  ]

  const filtered = items.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {filtered.map((a) => (
        <Card key={a.title} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{a.icon}</span>
              <h3 className="font-semibold">{en ? a.title : a.hi}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{en ? a.body : a.hiBody || a.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
