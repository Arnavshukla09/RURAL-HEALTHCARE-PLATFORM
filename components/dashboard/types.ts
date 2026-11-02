/**
 * components/dashboard/types.ts
 *
 * Types and localization catalogs for Dashboard.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Dashboard Subsystem
 */

export interface DashboardProps {
  user: any
  language: string
}

export interface RegisteredCamp {
  id: string
  title: string
  location: string
  date: string
  time: string
  type: string
  participants: number
}

export interface UserStats {
  consultations: number
  campaigns: number
}

export function getDashboardContent(language: string, userName: string) {
  const content = {
    en: {
      welcome: `Welcome back, ${userName}!`,
      quickActions: "Quick Actions",
      upcomingCampaigns: "Upcoming Health Campaigns",
      recentActivity: "Recent Activity",
      notifications: "Notifications",
      bookConsultation: "Book Consultation",
      viewDirectory: "Healthcare Directory",
      joinCampaign: "Join Campaigns",
      donate: "Support Local Healthcare",
      emergencyContact: "Emergency Contact",
      viewAll: "View All",
      noNotifications: "No new notifications",
      campaignReminder: "Blood donation camp tomorrow at Community Center",
      checkupReminder: "Free health checkup available this week",
      vaccinationAlert: "COVID vaccination drive starting Monday",
      stats: {
        consultations: "Consultations",
        campaigns: "Campaigns Joined",
        donations: "Donations Made",
      },
    },
    hi: {
      welcome: `वापसी पर स्वागत है, ${userName}!`,
      quickActions: "त्वरित कार्य",
      upcomingCampaigns: "आगामी स्वास्थ्य अभियान",
      recentActivity: "हाल की गतिविधि",
      notifications: "सूचनाएं",
      bookConsultation: "परामर्श बुक करें",
      viewDirectory: "स्वास्थ्य निर्देशिका",
      joinCampaign: "अभियानों में शामिल हों",
      donate: "स्थानीय स्वास्थ्य सेवा का समर्थन करें",
      emergencyContact: "आपातकालीन संपर्क",
      viewAll: "सभी देखें",
      noNotifications: "कोई नई सूचना नहीं",
      campaignReminder: "कल सामुदायिक केंद्र में रक्तदान शिविर",
      checkupReminder: "इस सप्ताह मुफ्त स्वास्थ्य जांच उपलब्ध",
      vaccinationAlert: "सोमवार से कोविड टीकाकरण अभियान शुरू",
      stats: {
        consultations: "परामर्श",
        campaigns: "अभियान में शामिल",
        donations: "दान किया",
      },
    },
  }

  return content[language as keyof typeof content] || content.en
}
