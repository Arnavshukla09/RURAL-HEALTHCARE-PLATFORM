const fs = require('fs');
const path = require('path');

const routes = {
  "dashboard": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Dashboard } from "@/components/Dashboard"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { AdminDashboard } from "@/components/AdminDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()

  if (loading) return null
  if (!user) { router.push("/login"); return null }

  if (user.role === "doctor") return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
  if (user.role === "admin") return <AdminDashboard language={language} user={user} />
  
  return <Dashboard language={language} user={user} />
}
`,
  "symptom-checker": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { SymptomChecker } from "@/components/SymptomChecker"

export default function Page() {
  const { language } = useApp()
  return <SymptomChecker language={language} />
}
`,
  "consultation": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { ConsultationPortal } from "@/components/ConsultationPortal"

export default function Page() {
  const { user, language, symptomCheckResult } = useApp()
  return <ConsultationPortal user={user} language={language} symptomResult={symptomCheckResult} />
}
`,
  "appointments": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AppointmentManager } from "@/components/AppointmentManager"

export default function Page() {
  const { user, language } = useApp()
  return <AppointmentManager user={user} language={language} setJitsiRoom={() => {}} />
}
`,
  "records": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { PatientRecords } from "@/components/PatientRecords"

export default function Page() {
  const { language } = useApp()
  return <PatientRecords language={language} />
}
`,
  "emergency": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { EmergencyModule } from "@/components/EmergencyModule"

export default function Page() {
  const { language } = useApp()
  return <EmergencyModule language={language} />
}
`,
  "locations": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { MapView } from "@/components/MapView"

export default function Page() {
  const { language } = useApp()
  return <MapView language={language} userLocation={null} camps={[]} />
}
`,
  "directory": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Directory } from "@/components/Directory"

export default function Page() {
  const { language } = useApp()
  return <Directory language={language} />
}
`,
  "camps": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { CampLocations } from "@/components/CampLocations"

export default function Page() {
  const { language } = useApp()
  return <CampLocations language={language} />
}
`,
  "health-info": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { HealthInfoHub } from "@/components/HealthInfoHub"

export default function Page() {
  const { language, symptomCheckResult } = useApp()
  return <HealthInfoHub language={language} symptomResult={symptomCheckResult} />
}
`,
  "doctor/dashboard": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorDashboard } from "@/components/DoctorDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "doctor") { router.push("/dashboard"); return null; }
  return <DoctorDashboard language={language} user={user} setJitsiRoom={() => {}} />
}
`,
  "doctor/patients": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorPatients } from "@/components/DoctorPatients"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "doctor") { router.push("/dashboard"); return null; }
  return <DoctorPatients language={language} />
}
`,
  "doctor/requests": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { DoctorAppointmentRequests } from "@/components/DoctorAppointmentRequests"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "doctor") { router.push("/dashboard"); return null; }
  return <DoctorAppointmentRequests language={language} setJitsiRoom={() => {}} />
}
`,
  "admin/dashboard": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminDashboard } from "@/components/AdminDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminDashboard language={language} user={user} />
}
`,
  "admin/users": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminUserManagement } from "@/components/AdminUserManagement"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminUserManagement language={language} />
}
`,
  "admin/campaigns": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminCampaignManager } from "@/components/AdminCampaignManager"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminCampaignManager language={language} />
}
`,
  "admin/notifications": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminNotifications } from "@/components/AdminNotifications"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminNotifications language={language} />
}
`,
  "admin/appointments": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminAppointments } from "@/components/AdminAppointments"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminAppointments language={language} />
}
`,
  "admin/records": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { AdminRecords } from "@/components/AdminRecords"
import { useRouter } from "next/navigation"

export default function Page() {
  const { user, language, loading } = useApp()
  const router = useRouter()
  if (loading) return null
  if (user?.role !== "admin") { router.push("/dashboard"); return null; }
  return <AdminRecords language={language} />
}
`,
  "login": `
"use client"
import { useApp } from "@/components/providers/AppProvider"
import { Authentication } from "@/components/Authentication"
import { useRouter } from "next/navigation"

export default function Page() {
  const { setUser, language } = useApp()
  const router = useRouter()
  return <Authentication setUser={setUser} setCurrentPage={(p) => router.push(p === "home" ? "/" : \`/\${p}\`)} language={language} />
}
`
}

Object.entries(routes).forEach(([route, content]) => {
  const file = path.join(__dirname, 'app', route, 'page.tsx');
  fs.writeFileSync(file, content.trim() + '\\n');
});

console.log("pages written!");
