"use client"
import { usePathname, useRouter } from "next/navigation"
import { useApp } from "@/components/providers/AppProvider"

export function BottomTabBar() {
  const { user, language } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const en = language === "en"

  if (!user || pathname === "/") return null

  const tabs = [
    { key: "/dashboard", icon: "🏠", label: en ? "Home" : "होम" },
    { key: "/symptom-checker", icon: "🩺", label: en ? "Symptoms" : "लक्षण" },
    { key: "/appointments", icon: "📅", label: en ? "Bookings" : "बुकिंग" },
    { key: "/emergency", icon: "🆘", label: en ? "Emergency" : "आपातकाल" },
  ]
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden safe-bottom">
      {tabs.map(tab => {
        // Special logic for dashboard root matching (e.g. /admin/dashboard vs /dashboard)
        const isActive = pathname === tab.key || (tab.key === "/dashboard" && pathname.includes("/dashboard"))
        
        return (
          <button key={tab.key} onClick={() => router.push(tab.key)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              isActive ? "text-teal-600 font-semibold" : "text-gray-500 hover:text-gray-700"
            }`}>
            <span className="text-xl leading-tight">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

