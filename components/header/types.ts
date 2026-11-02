/**
 * components/header/types.ts
 *
 * Types and navigation configurations for Header.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Header Subsystem
 */

import {
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  MapPin,
  Megaphone,
  Bell,
  Activity,
  LucideIcon,
} from "lucide-react"

export interface NavItem {
  key: string
  label: string
  icon: LucideIcon
}

export interface UserCareItem {
  key: string
  label: string
}

export interface RoleBadgeConfig {
  color: string
  label: string
}

export function getNavConfigs(en: boolean) {
  const doctorItems: NavItem[] = [
    { key: "/doctor/patients", label: en ? "Patients" : "मरीज़", icon: Users },
    { key: "/doctor/requests", label: en ? "Requests" : "अनुरोध", icon: Calendar },
    { key: "/appointments", label: en ? "Appointments" : "अपॉइंटमेंट", icon: ClipboardList },
    { key: "/directory", label: en ? "Doctors" : "डॉक्टर", icon: Stethoscope },
    { key: "/locations", label: en ? "Hospitals" : "अस्पताल", icon: MapPin },
  ]

  const adminItems: NavItem[] = [
    { key: "/admin/users", label: en ? "Users" : "उपयोगकर्ता", icon: Users },
    { key: "/admin/campaigns", label: en ? "Campaigns" : "अभियान", icon: Megaphone },
    { key: "/admin/appointments", label: en ? "Appointments" : "अपॉइंटमेंट", icon: Calendar },
    { key: "/admin/records", label: en ? "Records" : "रिकॉर्ड", icon: ClipboardList },
    { key: "/directory", label: en ? "Doctors" : "डॉक्टर", icon: Stethoscope },
    { key: "/locations", label: en ? "Hospitals" : "अस्पताल", icon: MapPin },
    { key: "/admin/notifications", label: en ? "Notify" : "सूचनाएं", icon: Bell },
  ]

  const publicNavItems: NavItem[] = [
    { key: "/symptom-checker", label: en ? "Symptoms" : "लक्षण", icon: Activity },
    { key: "/directory", label: en ? "Find Doctors" : "डॉक्टर खोजें", icon: Stethoscope },
    { key: "/locations", label: en ? "Find Hospitals" : "अस्पताल खोजें", icon: MapPin },
  ]

  const userCareItems: UserCareItem[] = [
    { key: "/consultation", label: en ? "Book Consultation" : "परामर्श बुक करें" },
    { key: "/appointments", label: en ? "My Appointments" : "मेरी अपॉइंटमेंट" },
    { key: "/records", label: en ? "Medical Records" : "चिकित्सा रिकॉर्ड" },
  ]

  const roleBadge: Record<string, RoleBadgeConfig> = {
    doctor: { color: "bg-teal-500", label: "Doctor" },
    admin: { color: "bg-purple-500", label: "Admin" },
    patient: { color: "bg-blue-500", label: "Patient" },
  }

  return { doctorItems, adminItems, publicNavItems, userCareItems, roleBadge }
}
