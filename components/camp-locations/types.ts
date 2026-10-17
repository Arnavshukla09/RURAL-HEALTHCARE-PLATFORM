/**
 * components/camp-locations/types.ts
 *
 * Types and static camp seed data for Camp Locations.
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 * Rural Healthcare Platform — Outreach & Camps Subsystem
 */

export interface CampLocationsProps {
  language: string
}

export interface CampLocation {
  id: number | string
  name: string
  type: "blood-donation" | "checkup" | "vaccination"
  address: string
  landmark: string
  coordinates: { lat: number; lng: number }
  date: string
  time: string
  contact: string
  participants: number
  status: "active" | "upcoming" | "completed"
  description: string
}

export function getInitialCamps(language: string, currentYear: number): CampLocation[] {
  const en = language === "en"
  return [
    {
      id: 1,
      name: en ? "NHM Free Health Checkup Camp" : "NHM मुफ्त स्वास्थ्य जांच शिविर",
      type: "checkup",
      address: en ? "CHC Berasia, Bhopal District" : "CHC बैरसिया, भोपाल जिला",
      landmark: en ? "Near Berasia Bus Stand" : "बैरसिया बस स्टैंड के पास",
      coordinates: { lat: 23.6352, lng: 77.4325 },
      date: `${currentYear}-08-15`,
      time: "09:00 AM",
      contact: "+91 755-2770491",
      participants: 150,
      status: "upcoming",
      description: en ? "NHM Madhya Pradesh free screening: BP, diabetes, anemia, eye & dental checkup for all ages" : "NHM मध्य प्रदेश मुफ्त जांच: बीपी, मधुमेह, एनीमिया, आंख और दंत जांच",
    },
    {
      id: 2,
      name: en ? "Ayushman Arogya Mandir — Wellness Day" : "आयुष्मान आरोग्य मंदिर — वेलनेस दिवस",
      type: "checkup",
      address: en ? "PHC Sehore, Sehore District" : "PHC सीहोर, सीहोर जिला",
      landmark: en ? "Near District Collectorate" : "जिला कलेक्ट्रेट के पास",
      coordinates: { lat: 23.2050, lng: 77.0851 },
      date: `${currentYear}-08-01`,
      time: "08:00 AM",
      contact: "+91 7562-224430",
      participants: 200,
      status: "active",
      description: en ? "Monthly Wellness Day at AB-HWC: free NCD screening, yoga, TB and hypertension checks" : "AB-HWC मासिक वेलनेस दिवस: मुफ्त NCD जांच, योग, TB और उच्च रक्तचाप जांच",
    },
    {
      id: 3,
      name: en ? "RBSK School Health Screening" : "RBSK स्कूल स्वास्थ्य जांच",
      type: "checkup",
      address: en ? "Govt Higher Secondary School, Vidisha" : "राजकीय उच्चतर माध्यमिक विद्यालय, विदिशा",
      landmark: en ? "Vidisha Old City" : "विदिशा पुराना शहर",
      coordinates: { lat: 23.5252, lng: 77.8081 },
      date: `${currentYear}-08-20`,
      time: "10:00 AM",
      contact: "+91 7592-234567",
      participants: 300,
      status: "upcoming",
      description: en ? "Rashtriya Bal Swasthya Karyakram: free screening of children for birth defects, diseases, deficiencies & developmental delays" : "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम: जन्म दोष, बीमारी, कमी और विकास में देरी की मुफ्त जांच",
    },
    {
      id: 4,
      name: en ? "Jan Aushadhi Camp & Medicine Distribution" : "जन औषधि शिविर और दवा वितरण",
      type: "checkup",
      address: en ? "Jan Aushadhi Kendra, Hoshangabad Rd, Bhopal" : "जन औषधि केंद्र, होशंगाबाद रोड, भोपाल",
      landmark: en ? "Near Habibganj Railway Station" : "हबीबगंज रेलवे स्टेशन के पास",
      coordinates: { lat: 23.2295, lng: 77.4382 },
      date: `${currentYear}-08-10`,
      time: "10:00 AM",
      contact: "+91 1800-180-8080",
      participants: 80,
      status: "upcoming",
      description: en ? "Free generic medicines at MRP + basic health checkup by AYUSH doctors" : "MRP पर मुफ्त जेनेरिक दवाइयां + AYUSH डॉक्टर द्वारा बुनियादी स्वास्थ्य जांच",
    },
    {
      id: 5,
      name: en ? "Indian Red Cross Blood Donation Drive" : "भारतीय रेड क्रॉस रक्तदान अभियान",
      type: "blood-donation",
      address: en ? "Red Cross Bhawan, TT Nagar, Bhopal" : "रेड क्रॉस भवन, टीटी नगर, भोपाल",
      landmark: en ? "Opposite TT Nagar Stadium" : "टीटी नगर स्टेडियम के सामने",
      coordinates: { lat: 23.2330, lng: 77.4020 },
      date: `${currentYear}-08-14`,
      time: "09:00 AM",
      contact: "+91 755-2661491",
      participants: 120,
      status: "upcoming",
      description: en ? "Voluntary blood donation drive by MP State Red Cross Society — all blood groups needed" : "MP राज्य रेड क्रॉस सोसाइटी द्वारा स्वैच्छिक रक्तदान अभियान — सभी ब्लड ग्रुप की जरूरत",
    },
    {
      id: 6,
      name: en ? "Pulse Polio Immunization Round" : "पल्स पोलियो टीकाकरण अभियान",
      type: "vaccination",
      address: en ? "Anganwadi Centre, Raisen District" : "आंगनवाड़ी केंद्र, रायसेन जिला",
      landmark: en ? "Near Raisen Fort Road" : "रायसेन किला रोड के पास",
      coordinates: { lat: 23.3315, lng: 77.7874 },
      date: `${currentYear}-08-25`,
      time: "08:00 AM",
      contact: "+91 7482-222333",
      participants: 250,
      status: "upcoming",
      description: en ? "National Immunization Day: OPV drops for children 0-5 years at all booths in Raisen" : "राष्ट्रीय टीकाकरण दिवस: रायसेन में सभी बूथों पर 0-5 वर्ष के बच्चों के लिए OPV ड्रॉप्स",
    },
    {
      id: 7,
      name: en ? "ASHA Maternal & Child Health Camp" : "ASHA मातृ एवं शिशु स्वास्थ्य शिविर",
      type: "checkup",
      address: en ? "Sub-Centre, Obedullaganj, Raisen" : "उप-केंद्र, ओबेदुल्लागंज, रायसेन",
      landmark: en ? "Near Govt School" : "सरकारी स्कूल के पास",
      coordinates: { lat: 23.4052, lng: 77.5903 },
      date: `${currentYear}-08-05`,
      time: "09:30 AM",
      contact: "+91 7480-255444",
      participants: 60,
      status: "active",
      description: en ? "ASHA-led prenatal checkups, iron-folic acid distribution, nutrition counseling for pregnant & lactating women" : "ASHA द्वारा प्रसवपूर्व जांच, आयरन-फोलिक एसिड वितरण, गर्भवती और स्तनपान कराने वाली महिलाओं के लिए पोषण परामर्श",
    },
    {
      id: 8,
      name: en ? "RNTCP TB Screening Camp" : "RNTCP TB जांच शिविर",
      type: "checkup",
      address: en ? "District TB Centre, Hamidia Hospital, Bhopal" : "जिला TB केंद्र, हमीदिया अस्पताल, भोपाल",
      landmark: en ? "Inside Hamidia Hospital Campus" : "हमीदिया अस्पताल परिसर के अंदर",
      coordinates: { lat: 23.2688, lng: 77.4126 },
      date: `${currentYear}-08-12`,
      time: "10:00 AM",
      contact: "+91 755-2540222",
      participants: 90,
      status: "upcoming",
      description: en ? "Free sputum test, chest X-ray, CBNAAT testing under Nikshay Poshan Yojana" : "निक्षय पोषण योजना के तहत मुफ्त बलगम जांच, छाती X-रे, CBNAAT परीक्षण",
    },
  ]
}

export function getCampLocationsContent(language: string) {
  const content = {
    en: {
      title: "Nearest Camp Locations",
      subtitle: "Find health camps and events near you",
      searchPlaceholder: "Enter your location or village name...",
      locateMe: "Use My Location",
      showMap: "Show on Map",
      filterAll: "All Camps",
      filterBlood: "Blood Donation",
      filterCheckup: "Health Checkup",
      filterVaccination: "Vaccination",
      sortDistance: "By Location",
      sortDate: "Upcoming First",
      getDirections: "Get Directions",
      callCamp: "Call Camp",
      registerNow: "Register Now",
      shareLocation: "Share Location",
      today: "Today",
      tomorrow: "Tomorrow",
      active: "Active Now",
      upcoming: "Upcoming",
      completed: "Completed",
      participants: "participants",
      noLocation: "Please enter your location to find nearby camps",
      noCamps: "No camps found in your area",
      locationAccess: "Location access denied. Please enter manually.",
      viewOnMap: "View on Map",
    },
    hi: {
      title: "निकटतम शिविर स्थान",
      subtitle: "अपने नजदीकी स्वास्थ्य शिविर और कार्यक्रम खोजें",
      searchPlaceholder: "अपना स्थान या गांव का नाम दर्ज करें...",
      locateMe: "मेरा स्थान उपयोग करें",
      showMap: "मानचित्र पर दिखाएं",
      filterAll: "सभी शिविर",
      filterBlood: "रक्तदान",
      filterCheckup: "स्वास्थ्य जांच",
      filterVaccination: "टीकाकरण",
      sortDistance: "स्थान अनुसार",
      sortDate: "आगामी पहले",
      getDirections: "दिशा निर्देश पाएं",
      callCamp: "शिविर पर कॉल करें",
      registerNow: "अभी पंजीकरण करें",
      shareLocation: "स्थान साझा करें",
      today: "आज",
      tomorrow: "कल",
      active: "अभी सक्रिय",
      upcoming: "आगामी",
      completed: "पूर्ण",
      participants: "प्रतिभागी",
      noLocation: "निकटतम शिविर खोजने के लिए कृपया अपना स्थान दर्ज करें",
      noCamps: "आपके क्षेत्र में कोई शिविर नहीं मिला",
      locationAccess: "स्थान पहुंच अस्वीकृत। कृपया मैन्युअल रूप से दर्ज करें।",
      viewOnMap: "मानचित्र पर देखें",
    },
  }

  return content[language as keyof typeof content] || content.en
}
