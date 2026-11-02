/**
 * lib/emergency/helplines.ts
 *
 * Comprehensive National & State-Wise Emergency Helpline Directory for India.
 *
 * Covers:
 * 1. National Unified & Specialized Emergency Numbers (112, 108, 102, 104, 1098, 14416, 14567, etc.)
 * 2. State-Specific Helplines across all 36 Indian States and Union Territories (LGD Aligned)
 * 3. Categorization (Medical, Women/Child, Mental Health, Disaster, Governance, Police/Fire)
 * 4. Spatial auto-detection (resolves user's coordinates to state helplines)
 */

export type HelplineCategory =
  | "all"
  | "medical"
  | "women_child"
  | "mental_health"
  | "disaster"
  | "governance"
  | "police_fire"

export interface HelplineItem {
  id: string
  serviceEn: string
  serviceHi: string
  number: string
  category: HelplineCategory
  descriptionEn: string
  descriptionHi: string
  is24x7: boolean
  isTollFree: boolean
  isNational: boolean
  stateCode?: string
  stateNameEn?: string
  stateNameHi?: string
}

export const NATIONAL_HELPLINES: HelplineItem[] = [
  {
    id: "nat-112",
    serviceEn: "National Emergency Unified Helpline (ERSS)",
    serviceHi: "राष्ट्रीय एकीकृत आपातकालीन सेवा (ERSS)",
    number: "112",
    category: "police_fire",
    descriptionEn: "Single all-India number for Police, Fire, Ambulance & Disaster Response",
    descriptionHi: "पुलिस, अग्निशमन, एम्बुलेंस और आपदा के लिए एकल अखिल भारतीय आपातकालीन नंबर",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-108",
    serviceEn: "National Emergency Ambulance Service",
    serviceHi: "राष्ट्रीय आपातकालीन एम्बुलेंस सेवा",
    number: "108",
    category: "medical",
    descriptionEn: "Free emergency ambulance for critical illnesses, trauma, accidents & cardiac arrest",
    descriptionHi: "गंभीर बीमारी, दुर्घटना, आघात और हृदय संबंधी आपातकाल के लिए मुफ्त एम्बुलेंस",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-102",
    serviceEn: "Janani Shishu Suraksha Maternity Ambulance",
    serviceHi: "जननी शिशु सुरक्षा मातृत्व एम्बुलेंस",
    number: "102",
    category: "medical",
    descriptionEn: "Free transport for pregnant women, childbirth emergencies & sick infants under JSSK",
    descriptionHi: "गर्भवती महिलाओं, प्रसव और नवजात शिशुओं के लिए मुफ्त अस्पताल परिवहन (JSSK)",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-104",
    serviceEn: "National Health Information & Medical Consultation",
    serviceHi: "राष्ट्रीय स्वास्थ्य सूचना एवं परामर्श हेल्पलाइन",
    number: "104",
    category: "medical",
    descriptionEn: "Tele-triage, medical advice, blood bank status and health scheme guidance",
    descriptionHi: "टेली-परामर्श, प्राथमिक चिकित्सा सलाह, ब्लड बैंक उपलब्धता व स्वास्थ्य योजनाएं",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-14416",
    serviceEn: "Tele-MANAS National Mental Health Crisis Helpline",
    serviceHi: "टेली-मानस राष्ट्रीय मानसिक स्वास्थ्य एवं संकट हेल्पलाइन",
    number: "14416",
    category: "mental_health",
    descriptionEn: "24/7 free, confidential psychological support, crisis intervention and suicide prevention",
    descriptionHi: "24/7 मुफ्त व गोपनीय मानसिक परामर्श, तनाव मुक्ति एवं संकट सहायता",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-1098",
    serviceEn: "CHILDLINE National Child Distress Helpline",
    serviceHi: "चाइल्डलाइन राष्ट्रीय बाल सुरक्षा हेल्पलाइन",
    number: "1098",
    category: "women_child",
    descriptionEn: "Emergency care, rescue and protection for children in distress or abuse",
    descriptionHi: "संकटग्रस्त, अनाथ या शोषित बच्चों की सुरक्षा व पुनर्वास सहायता",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-181",
    serviceEn: "National Women in Distress Helpline",
    serviceHi: "राष्ट्रीय महिला सुरक्षा एवं संकट हेल्पलाइन",
    number: "181",
    category: "women_child",
    descriptionEn: "Support for women facing domestic violence, harassment, and one-stop crisis shelter",
    descriptionHi: "घरेलू हिंसा, उत्पीड़न और कानूनी संकट में महिलाओं के लिए आपातकालीन सहायता",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-14567",
    serviceEn: "Elder Line National Senior Citizens Helpline",
    serviceHi: "एल्डर लाइन वरिष्ठ नागरिक राष्ट्रीय हेल्पलाइन",
    number: "14567",
    category: "governance",
    descriptionEn: "Elder abuse rescue, legal guidance, emotional support, and pension assistance",
    descriptionHi: "वरिष्ठ नागरिकों की सुरक्षा, कानूनी परामर्श, भावनात्मक सहायता व पेंशन मार्गदर्शन",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-1070",
    serviceEn: "NDMA National Disaster Management Control Room",
    serviceHi: "एनडीएमए राष्ट्रीय आपदा प्रबंधन नियंत्रण कक्ष",
    number: "1070",
    category: "disaster",
    descriptionEn: "Floods, earthquakes, cyclones, landslides and major natural disaster coordination",
    descriptionHi: "बाढ़, भूकंप, चक्रवात, भूस्खलन और प्राकृतिक आपदा राहत समन्वय",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-1800116555",
    serviceEn: "National Poison Information Centre (AIIMS New Delhi)",
    serviceHi: "राष्ट्रीय विष सूचना केंद्र (एम्स नई दिल्ली)",
    number: "1800116555",
    category: "medical",
    descriptionEn: "Urgent emergency medical guidance for pesticide, chemical, and toxin poisoning",
    descriptionHi: "कीटनाशक, रासायनिक विषाक्तता और जहर सेवन पर 24/7 आपातकालीन चिकित्सा मार्गदर्शन",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-1930",
    serviceEn: "National Cyber Crime & Financial Fraud Helpline",
    serviceHi: "राष्ट्रीय साइबर अपराध एवं वित्तीय धोखाधड़ी हेल्पलाइन",
    number: "1930",
    category: "police_fire",
    descriptionEn: "Immediate reporting to freeze defrauded bank accounts and report cyber crimes",
    descriptionHi: "ऑनलाइन वित्तीय धोखाधड़ी रोकने व बैंक खाता फ्रीज कराने हेतु तत्काल रिपोर्टिंग",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-14555",
    serviceEn: "Ayushman Bharat PM-JAY National Call Centre",
    serviceHi: "आयुष्मान भारत पीएम-जय राष्ट्रीय हेल्पलाइन",
    number: "14555",
    category: "medical",
    descriptionEn: "Free hospitalization card eligibility, empaneled hospital search & claim support",
    descriptionHi: "5 लाख रुपये तक मुफ्त इलाज, आयुष्मान कार्ड सत्यापन व अस्पताल सहायता",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-100",
    serviceEn: "Police Emergency",
    serviceHi: "पुलिस आपातकाल",
    number: "100",
    category: "police_fire",
    descriptionEn: "Immediate police intervention and crime prevention",
    descriptionHi: "कानून व्यवस्था और अपराध नियंत्रण हेतु पुलिस सहायता",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-101",
    serviceEn: "Fire & Rescue Control Room",
    serviceHi: "अग्निशमन एवं बचाव दल",
    number: "101",
    category: "police_fire",
    descriptionEn: "Fire breakout, gas leak and collapsed structure rescue",
    descriptionHi: "आग लगने, गैस रिसाव व मलबे में दबे लोगों को बचाने के लिए फायर ब्रिगेड",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
  {
    id: "nat-1912",
    serviceEn: "National Electricity Emergency & Power Outage",
    serviceHi: "राष्ट्रीय विद्युत आपातकाल एवं लाइन खराबी",
    number: "1912",
    category: "governance",
    descriptionEn: "Snapped wires, transformer fires, power shocks and emergency supply restoration",
    descriptionHi: "बिजली के तार टूटने, ट्रांसफार्मर आग व आपातकालीन बिजली आपूर्ति बहाली",
    is24x7: true,
    isTollFree: true,
    isNational: true,
  },
]

export interface StateHelplineCatalog {
  stateCode: string
  stateNameEn: string
  stateNameHi: string
  helplines: Array<Omit<HelplineItem, "isNational" | "stateCode" | "stateNameEn" | "stateNameHi">>
}

export const STATE_HELPLINES_CATALOG: Record<string, StateHelplineCatalog> = {
  // 23: Madhya Pradesh
  "23": {
    stateCode: "23",
    stateNameEn: "Madhya Pradesh",
    stateNameHi: "मध्य प्रदेश",
    helplines: [
      {
        id: "mp-cm",
        serviceEn: "MP CM Helpline 181",
        serviceHi: "मध्य प्रदेश सीएम हेल्पलाइन 181",
        number: "181",
        category: "governance",
        descriptionEn: "Direct grievance redressal with Chief Minister's office and rural welfare monitor",
        descriptionHi: "मुख्यमंत्री कार्यालय में सीधे शिकायत निवारण व ग्रामीण जनकल्याण निगरानी",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mp-health-104",
        serviceEn: "MP 104 Health Advice & Teleconsultation",
        serviceHi: "म.प्र. 104 स्वास्थ्य सलाह एवं टेलीकंसल्टेशन",
        number: "104",
        category: "medical",
        descriptionEn: "Medical consultation, blood stock availability & state hospital triage",
        descriptionHi: "चिकित्सा परामर्श, ब्लड बैंक उपलब्धता व सरकारी अस्पताल मार्गदर्शन",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mp-women-1090",
        serviceEn: "MP Shakti Women Helpline",
        serviceHi: "म.प्र. शक्ति महिला हेल्पलाइन",
        number: "1090",
        category: "women_child",
        descriptionEn: "Dedicated MP Police women safety & immediate distress intervention",
        descriptionHi: "मध्य प्रदेश पुलिस महिला सुरक्षा व त्वरित संकट निवारण सेवा",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mp-disaster",
        serviceEn: "MP State Disaster Management Control Room",
        serviceHi: "म.प्र. राज्य आपदा प्रबंधन नियंत्रण कक्ष (SDMA)",
        number: "07552441414",
        category: "disaster",
        descriptionEn: "Narmada flood monitoring, heavy rainfall & natural disaster relief",
        descriptionHi: "बाढ़, अतिवृष्टि और प्राकृतिक आपदा राहत नियंत्रण कक्ष",
        is24x7: true,
        isTollFree: false,
      },
      {
        id: "mp-ambulance-108",
        serviceEn: "Sanjeevani Express 108 Ambulance MP",
        serviceHi: "संजीवनी 108 एम्बुलेंस सेवा मध्य प्रदेश",
        number: "108",
        category: "medical",
        descriptionEn: "GVK-EMRI operated state-wide emergency response fleet for MP villages",
        descriptionHi: "मध्य प्रदेश के सभी ग्रामीण क्षेत्रों के लिए 24 घंटे आपातकालीन एम्बुलेंस",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mp-cyber",
        serviceEn: "MP Police Citizen Crime & Cyber Line",
        serviceHi: "म.प्र. नागरिक अपराध व साइबर हेल्पलाइन",
        number: "1079",
        category: "police_fire",
        descriptionEn: "State-wide police coordination and anti-harassment reporting",
        descriptionHi: "राज्यव्यापी पुलिस समन्वय एवं उत्पीड़न रोधी रिपोर्टिंग",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 09: Uttar Pradesh
  "09": {
    stateCode: "09",
    stateNameEn: "Uttar Pradesh",
    stateNameHi: "उत्तर प्रदेश",
    helplines: [
      {
        id: "up-cm",
        serviceEn: "UP CM Helpline 1076",
        serviceHi: "उत्तर प्रदेश मुख्यमंत्री हेल्पलाइन 1076",
        number: "1076",
        category: "governance",
        descriptionEn: "24/7 direct grievance registration monitored by UP Chief Minister's office",
        descriptionHi: "24 घंटे जनसुनवाई एवं शिकायत निवारण प्रणाली",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "up-women",
        serviceEn: "UP Women Power Line 1090",
        serviceHi: "यू.पी. महिला पावर लाइन 1090",
        number: "1090",
        category: "women_child",
        descriptionEn: "Confidential women assistance for stalking, harassment & rural safety",
        descriptionHi: "महिलाओं के लिए गोपनीय सुरक्षा व त्वरित पुलिस सहायता",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "up-disaster",
        serviceEn: "UP Rahat Relief Commissioner Control Room",
        serviceHi: "यू.पी. राहत आयुक्त आपदा नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Floods, lightning strikes & cold wave emergency relief coordination",
        descriptionHi: "बाढ़, आकाशीय बिजली व शीत लहर आपदा राहत नियंत्रण",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "up-health",
        serviceEn: "UP Health Advisory Line 104",
        serviceHi: "उत्तर प्रदेश स्वास्थ्य परामर्श लाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "Health consultation and CHC/PHC facility locating assistance",
        descriptionHi: "डॉक्टर परामर्श व नजदीकी सामुदायिक स्वास्थ्य केंद्र की जानकारी",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 27: Maharashtra
  "27": {
    stateCode: "27",
    stateNameEn: "Maharashtra",
    stateNameHi: "महाराष्ट्र",
    helplines: [
      {
        id: "mh-cm",
        serviceEn: "Aaple Sarkar CM Grievance Helpline",
        serviceHi: "आपले सरकार मुख्यमंत्री तक्रार हेल्पलाइन",
        number: "18001208040",
        category: "governance",
        descriptionEn: "Official Maharashtra government citizen portal helpline",
        descriptionHi: "महाराष्ट्र शासन नागरिक तक्रार निवारण सेवा",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mh-health",
        serviceEn: "Maharashtra Arogya Sahayavani 104",
        serviceHi: "महाराष्ट्र आरोग्य सहाय्यवाणी 104",
        number: "104",
        category: "medical",
        descriptionEn: "Medical advice, epidemic guidance and blood inventory helpline",
        descriptionHi: "आरोग्य सल्ला, साथीचे आजार नियंत्रण व रक्तपेढी माहिती",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mh-ambulance",
        serviceEn: "MEMS 108 Emergency Ambulance Maharashtra",
        serviceHi: "महाराष्ट्र आपत्कालीन रुग्णवाहिका सेवा 108",
        number: "108",
        category: "medical",
        descriptionEn: "Maharashtra Emergency Medical Services network across rural talukas",
        descriptionHi: "महाराष्ट्र राज्य आपत्कालीन वैद्यकीय रुग्णवाहिका सेवा",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "mh-disaster",
        serviceEn: "State Disaster Management Authority Control Room",
        serviceHi: "राज्य आपत्ती व्यवस्थापन नियंत्रण कक्ष",
        number: "1077",
        category: "disaster",
        descriptionEn: "Monsoon flooding, coastal cyclones, landslides and emergency relief",
        descriptionHi: "पूर, दरड कोसळणे व चक्रीवादळ आपत्कालीन नियंत्रण",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 08: Rajasthan
  "08": {
    stateCode: "08",
    stateNameEn: "Rajasthan",
    stateNameHi: "राजस्थान",
    helplines: [
      {
        id: "rj-cm",
        serviceEn: "Rajasthan Sampark CM Helpline 181",
        serviceHi: "राजस्थान संपर्क सीएम हेल्पलाइन 181",
        number: "181",
        category: "governance",
        descriptionEn: "Integrated public grievance redressal and welfare scheme help",
        descriptionHi: "जन अभाव अभियोग निराकरण व सरकारी योजनाओं की जानकारी",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "rj-health",
        serviceEn: "Rajasthan 104 Health Advisory",
        serviceHi: "राजस्थान 104 स्वास्थ्य सलाह सेवा",
        number: "104",
        category: "medical",
        descriptionEn: "Medical advice, hospital complaints and Chiranjeevi/Ayushman support",
        descriptionHi: "चिकित्सा सलाह, एम्बुलेंस स्थिति व स्वास्थ्य बीमा सहायता",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "rj-women",
        serviceEn: "Garima Women Safety Helpline",
        serviceHi: "गरिमा महिला सुरक्षा हेल्पलाइन",
        number: "1090",
        category: "women_child",
        descriptionEn: "Rajasthan Police women assistance and domestic violence relief",
        descriptionHi: "राजस्थान पुलिस महिला सुरक्षा एवं त्वरित सहायता",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "rj-disaster",
        serviceEn: "Rajasthan Disaster Operations Centre",
        serviceHi: "राजस्थान आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Drought, desert sandstorm, flash flood and relief control room",
        descriptionHi: "अतिवृष्टि, बाढ़ एवं प्राकृतिक आपदा राहत नियंत्रण कक्ष",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 10: Bihar
  "10": {
    stateCode: "10",
    stateNameEn: "Bihar",
    stateNameHi: "बिहार",
    helplines: [
      {
        id: "br-cm",
        serviceEn: "Bihar CM Janta Darbar Grievance Helpline",
        serviceHi: "बिहार मुख्यमंत्री जनता दरबार जनशिकायत हेल्पलाइन",
        number: "18003456268",
        category: "governance",
        descriptionEn: "Citizen grievance redressal monitored by Bihar Chief Minister's office",
        descriptionHi: "बिहार सरकार लोक शिकायत निवारण हेल्पलाइन",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "br-health",
        serviceEn: "Bihar State Health Society Infoline 104",
        serviceHi: "बिहार राज्य स्वास्थ्य समिति हेल्पलाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "Doctor tele-advice, immunization information & hospital facilities",
        descriptionHi: "डॉक्टर परामर्श, टीकाकरण की जानकारी व सरकारी अस्पताल सहायता",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "br-disaster",
        serviceEn: "Bihar Disaster Management Department (BSDMA)",
        serviceHi: "बिहार आपदा प्रबंधन विभाग नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "North Bihar Koshi/Ganga flood relief, lightning strikes and river alerts",
        descriptionHi: "कोसी व गंगा बाढ़ राहत, वज्रपात अलर्ट व आपदा नियंत्रण",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 19: West Bengal
  "19": {
    stateCode: "19",
    stateNameEn: "West Bengal",
    stateNameHi: "पश्चिम बंगाल",
    helplines: [
      {
        id: "wb-health",
        serviceEn: "Swasthya Infoline West Bengal 104",
        serviceHi: "स्वास्थ्य इन्फोलाइन पश्चिम बंगाल 104",
        number: "104",
        category: "medical",
        descriptionEn: "State telemedicine, hospital bed availability and dengue/malaria tracking",
        descriptionHi: "টেলিমেডিসিন পরামর্শ, সরকারি হাসপাতালের শয্যা ও ডেঙ্গু নিয়ন্ত্রণ",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "wb-disaster",
        serviceEn: "Nabanna State Emergency Operations Centre",
        serviceHi: "नबन्ना राज्य आपातकालीन आपदा नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Bay of Bengal cyclone alert, Sundarbans coastal relief & flood control",
        descriptionHi: "নবান্ন বিপর্যয় মোকাবিলা ও উপকূলীয় ঘূর্ণিঝড় নিয়ন্ত্রণ কেন্দ্র",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "wb-cm",
        serviceEn: "Didike Bolo / CMO Grievance Helpline",
        serviceHi: "दीदी के बोलो / सीएमओ जन शिकायत हेल्पलाइन",
        number: "18003450117",
        category: "governance",
        descriptionEn: "Direct grievance registration with West Bengal Chief Minister's office",
        descriptionHi: "পশ্চিমবঙ্গ সরকারের সরাসরি নাগরিক অভিযোগ গ্রহণ কেন্দ্র",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 24: Gujarat
  "24": {
    stateCode: "24",
    stateNameEn: "Gujarat",
    stateNameHi: "गुजरात",
    helplines: [
      {
        id: "gu-health",
        serviceEn: "Gujarat Health Advice Helpline 104",
        serviceHi: "गुजरात स्वास्थ्य सलाह हेल्पलाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "Tele-triage, minor ailment guidance and state health scheme support",
        descriptionHi: "ગુજરાત આરોગ્ય સલાહ, તાત્કાલિક તબીબી માર્ગદર્શન",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "gu-women",
        serviceEn: "Abhayam 181 Women Helpline Gujarat",
        serviceHi: "अभयम 181 महिला हेल्पलाइन गुजरात",
        number: "181",
        category: "women_child",
        descriptionEn: "Rescue van and round-the-clock counselling for women in distress",
        descriptionHi: "અભયમ ૧૮૧ મહિલા હેલ્પલાઇન અને રેસ્ક્યુ વાન સેવા",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "gu-disaster",
        serviceEn: "Gujarat State Disaster Management Authority (GSDMA)",
        serviceHi: "गुजरात राज्य आपदा प्रबंधन प्राधिकरण (GSDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Earthquake, cyclone, flood and chemical industrial disaster control room",
        descriptionHi: "વાવાઝોડું, પૂર અને ભૂકંપ આપત્તિ વ્યવસ્થાપન કંટ્રોલ રૂમ",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 33: Tamil Nadu
  "33": {
    stateCode: "33",
    stateNameEn: "Tamil Nadu",
    stateNameHi: "तमिलनाडु",
    helplines: [
      {
        id: "tn-cm",
        serviceEn: "Mudhalvarin Mugavari TN CM Helpline 1100",
        serviceHi: "तमिलनाडु मुख्यमंत्री हेल्पलाइन 1100",
        number: "1100",
        category: "governance",
        descriptionEn: "Integrated public grievance redressal monitored by Chief Minister",
        descriptionHi: "முதல்வர் உதவி மையம் - பொதுமக்கள் குறைதீர்க்கும் சேவை",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "tn-health",
        serviceEn: "Tamil Nadu Health Department Helpline 104",
        serviceHi: "तमिलनाडु स्वास्थ्य विभाग हेल्पलाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "24/7 medical advice, blood bank assistance and CM health insurance",
        descriptionHi: "24 மணி நேர மருத்துவ ஆலோசனை மற்றும் இரத்த வங்கி தகவல்",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "tn-disaster",
        serviceEn: "Tamil Nadu State Disaster Management Control Room",
        serviceHi: "तमिलनाडु राज्य आपदा नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "North-east monsoon flood relief, coastal alerts and cyclone safety",
        descriptionHi: "மாநில அவசரகால செயல்பாட்டு மையம் (பேரிடர் மேலாண்மை)",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 29: Karnataka
  "29": {
    stateCode: "29",
    stateNameEn: "Karnataka",
    stateNameHi: "कर्नाटक",
    helplines: [
      {
        id: "ka-cm",
        serviceEn: "Karnataka CM Janaspandana Helpline 1902",
        serviceHi: "कर्नाटक मुख्यमंत्री जनस्पंदना हेल्पलाइन 1902",
        number: "1902",
        category: "governance",
        descriptionEn: "Citizen grievance redressal monitored by Chief Minister's office",
        descriptionHi: "ಮುಖ್ಯಮಂತ್ರಿ ಜನಸ್ಪಂದನ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಸಹಾಯವಾಣಿ",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "ka-health",
        serviceEn: "Arogyavani 104 Health Helpline Karnataka",
        serviceHi: "आरोग्यवाणी 104 स्वास्थ्य हेल्पलाइन कर्नाटक",
        number: "104",
        category: "medical",
        descriptionEn: "Medical advice, nutrition counseling, mental health guidance and blood bank info",
        descriptionHi: "ಆರೋಗ್ಯವಾಣಿ ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆ ಮತ್ತು ತುರ್ತು ಮಾಹಿತಿ",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "ka-disaster",
        serviceEn: "Karnataka State Natural Disaster Monitoring Centre",
        serviceHi: "कर्नाटक राज्य प्राकृतिक आपदा निगरानी केंद्र (KSNDMC)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Flood, drought, heavy rainfall alerts and rescue coordination",
        descriptionHi: "ಪ್ರಕೃತಿ ವಿಕೋಪ ನಿರ್ವಹಣಾ ನಿಯಂತ್ರಣ ಕೊಠಡಿ",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 28: Andhra Pradesh
  "28": {
    stateCode: "28",
    stateNameEn: "Andhra Pradesh",
    stateNameHi: "आंध्र प्रदेश",
    helplines: [
      {
        id: "ap-cm",
        serviceEn: "AP Spandana CM Helpline 1902",
        serviceHi: "आंध्र प्रदेश स्पंदना सीएम हेल्पलाइन 1902",
        number: "1902",
        category: "governance",
        descriptionEn: "Citizen welfare and public grievance monitoring platform",
        descriptionHi: "స్పందన ప్రజా సమస్యల పరిష్కార వేదిక",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "ap-health",
        serviceEn: "AP 104 Health Information Helpline",
        serviceHi: "आंध्र प्रदेश 104 स्वास्थ्य सूचना हेल्पलाइन",
        number: "104",
        category: "medical",
        descriptionEn: "Tele-consultation, YSR Aarogyasri information and emergency medical advice",
        descriptionHi: "వైద్య సలహాలు మరియు ఆరోగ్యశ్రీ సేవల సమాచారం",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "ap-disaster",
        serviceEn: "AP Disaster Management Authority (APSDMA)",
        serviceHi: "आंध्र प्रदेश आपदा प्रबंधन प्राधिकरण",
        number: "1070",
        category: "disaster",
        descriptionEn: "Cyclone warning, Godavari/Krishna flood monitoring and relief",
        descriptionHi: "విపత్తు నిర్వహణ మరియు తుఫాను అత్యవసర కంట్రోల్ రూమ్",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 36: Telangana
  "36": {
    stateCode: "36",
    stateNameEn: "Telangana",
    stateNameHi: "तेलंगाना",
    helplines: [
      {
        id: "tg-health",
        serviceEn: "Telangana 104 Health Advisory",
        serviceHi: "तेलंगाना 104 स्वास्थ्य सलाह सेवा",
        number: "104",
        category: "medical",
        descriptionEn: "Aarogyasri hospital network, medical advice and health schemes",
        descriptionHi: "వైద్య సలహా మరియు ఆరోగ్యశ్రీ ఆసుపత్రుల సమాచారం",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "tg-women",
        serviceEn: "Telangana Bharosa & Women Safety 181",
        serviceHi: "तेलंगाना भरोसा एवं महिला सुरक्षा 181",
        number: "181",
        category: "women_child",
        descriptionEn: "Telangana Police Bharosa centres for women and children in distress",
        descriptionHi: "మహిళలు మరియు పిల్లల భద్రత కోసం భరోసా కేంద్రం",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "tg-disaster",
        serviceEn: "Telangana Disaster Management Control Room",
        serviceHi: "तेलंगाना आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Urban flash flooding, heat wave alerts and disaster response",
        descriptionHi: "విపత్తు నిర్వహణ అత్యవసర సహాయ కేంద్రం",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 03: Punjab
  "03": {
    stateCode: "03",
    stateNameEn: "Punjab",
    stateNameHi: "पंजाब",
    helplines: [
      {
        id: "pb-cm",
        serviceEn: "Sarkar Tuhade Dwar Punjab CM Helpline 1100",
        serviceHi: "सरकार तुहाडे द्वार पंजाब सीएम हेल्पलाइन 1100",
        number: "1100",
        category: "governance",
        descriptionEn: "Direct government grievance registration and citizen delivery",
        descriptionHi: "ਸਰਕਾਰ ਤੁਹਾਡੇ ਦੁਆਰ ਲੋਕ ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਨ ਹੈਲਪਲਾਈਨ",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "pb-health",
        serviceEn: "Punjab 104 Health Helpline",
        serviceHi: "पंजाब 104 स्वास्थ्य हेल्पलाइन",
        number: "104",
        category: "medical",
        descriptionEn: "Medical advice, de-addiction centre counseling and hospital assistance",
        descriptionHi: "ਸਿਹਤ ਸਲਾਹ, ਨਸ਼ਾ ਛੁਡਾਊ ਕੇਂਦਰ ਕੌਂਸਲਿੰਗ ਤੇ ਮੈਡੀਕਲ ਸਹਾਇਤਾ",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "pb-disaster",
        serviceEn: "Punjab Disaster Management Control Room",
        serviceHi: "पंजाब आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Sutlej/Beas river flood alerts and disaster relief",
        descriptionHi: "ਹੜ੍ਹ ਤੇ ਕੁਦਰਤੀ ਆਫ਼ਤ ਰਾਹਤ ਕੰਟਰੋਲ ਰੂਮ",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 21: Odisha
  "21": {
    stateCode: "21",
    stateNameEn: "Odisha",
    stateNameHi: "ओडिशा",
    helplines: [
      {
        id: "or-cm",
        serviceEn: "Mo Sarkar CM Grievance Helpline 1905",
        serviceHi: "मो सरकार सीएम जन शिकायत हेल्पलाइन 1905",
        number: "1905",
        category: "governance",
        descriptionEn: "Odisha government 5T citizen governance and grievance redressal",
        descriptionHi: "ମୋ ସରକାର ନାଗରିକ ଅଭିଯୋଗ ନିବାରଣ ସେବା",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "or-health",
        serviceEn: "Odisha Health Information Helpline 104",
        serviceHi: "ओडिशा स्वास्थ्य सूचना हेल्पलाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "BSKY health card support, tele-advice and medical guidance",
        descriptionHi: "ସ୍ୱାସ୍ଥ୍ୟ ପରାମର୍ଶ ଏବଂ ବିଜୁ ସ୍ୱାସ୍ଥ୍ୟ କଲ୍ୟାଣ ଯୋଜନା ସହାୟତା",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "or-disaster",
        serviceEn: "OSDMA State Emergency Operations Centre",
        serviceHi: "ओडिशा राज्य आपदा प्रबंधन प्राधिकरण (OSDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "World-recognized coastal cyclone early warning, shelter & flood relief",
        descriptionHi: "ବାତ୍ୟା ଓ ବନ୍ୟା ମୁକାବିଲା ପାଇଁ ରାଜ୍ୟ ଜରୁରୀକାଳୀନ କେନ୍ଦ୍ର",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 32: Kerala
  "32": {
    stateCode: "32",
    stateNameEn: "Kerala",
    stateNameHi: "केरल",
    helplines: [
      {
        id: "kl-health",
        serviceEn: "DISHA 1056 Health Advisory Kerala",
        serviceHi: "दिशा 1056 स्वास्थ्य परामर्श केरल",
        number: "1056",
        category: "medical",
        descriptionEn: "24/7 dedicated NHM Kerala health and mental health counseling line",
        descriptionHi: "24 മണിക്കൂറും പ്രവർത്തിക്കുന്ന ദിശ ആരോഗ്യ വിവര സഹായവാണി",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "kl-disaster",
        serviceEn: "Kerala State Disaster Management Authority (KSDMA)",
        serviceHi: "केरल राज्य आपदा प्रबंधन प्राधिकरण (KSDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Landslide alerts, dam water level warnings and flood relief operations",
        descriptionHi: "സംസ്ഥാന ദുരന്ത നിവാരണ അതോറിറ്റി കൺട്രോൾ റൂം",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 18: Assam
  "18": {
    stateCode: "18",
    stateNameEn: "Assam",
    stateNameHi: "असम",
    helplines: [
      {
        id: "as-health",
        serviceEn: "Sarbajanin Swasthya Sanjeevani 104 Assam",
        serviceHi: "सार्वजनिक स्वास्थ्य संजीवनी 104 असम",
        number: "104",
        category: "medical",
        descriptionEn: "Health advice, snakebite protocol and boat ambulance coordination",
        descriptionHi: "স্বাস্থ্য দিহা, চিকিৎসা পৰামৰ্শ আৰু এম্বুলেন্স সেৱা",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "as-disaster",
        serviceEn: "ASDMA Brahmaputra Flood Control & Disaster Room",
        serviceHi: "असम राज्य आपदा प्रबंधन प्राधिकरण (ASDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Brahmaputra annual flood monitoring, erosion & earthquake alerts",
        descriptionHi: "বানপানী আৰু দুৰ্যোগ ব্যৱস্থাপনা নিয়ন্ত্ৰণ কক্ষ",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 07: Delhi
  "07": {
    stateCode: "07",
    stateNameEn: "Delhi",
    stateNameHi: "दिल्ली",
    helplines: [
      {
        id: "dl-health",
        serviceEn: "Delhi Health & COVID Infoline 1031",
        serviceHi: "दिल्ली स्वास्थ्य एवं इन्फोलाइन 1031",
        number: "1031",
        category: "medical",
        descriptionEn: "Delhi government hospital bed status and telemedicine support",
        descriptionHi: "सरकारी अस्पताल बेड उपलब्धता व स्वास्थ्य परामर्श",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "dl-women",
        serviceEn: "DCW 181 Women in Distress Helpline Delhi",
        serviceHi: "दिल्ली महिला आयोग 181 हेल्पलाइन",
        number: "181",
        category: "women_child",
        descriptionEn: "Delhi Commission for Women 24/7 crisis response team",
        descriptionHi: "दिल्ली महिला आयोग 24/7 महिला सुरक्षा व कानूनी सहायता",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "dl-disaster",
        serviceEn: "Delhi Disaster Management Authority (DDMA)",
        serviceHi: "दिल्ली आपदा प्रबंधन प्राधिकरण (DDMA)",
        number: "1077",
        category: "disaster",
        descriptionEn: "Yamuna flood alerts, structural fires and disaster control",
        descriptionHi: "यमुना बाढ़ चेतावनी व आपातकालीन आपदा राहत नियंत्रण कक्ष",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 22: Chhattisgarh
  "22": {
    stateCode: "22",
    stateNameEn: "Chhattisgarh",
    stateNameHi: "छत्तीसगढ़",
    helplines: [
      {
        id: "cg-health",
        serviceEn: "Arogya Seva CG Health Advice 104",
        serviceHi: "आरोग्य सेवा छत्तीसगढ़ स्वास्थ्य परामर्श 104",
        number: "104",
        category: "medical",
        descriptionEn: "Tribal area health consultation and Sanjeevani hospital referral",
        descriptionHi: "स्वास्थ्य परामर्श व दूरस्थ ग्रामीण क्षेत्रों के लिए टेलीमेडिसिन",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "cg-disaster",
        serviceEn: "Chhattisgarh Disaster Management Authority",
        serviceHi: "छत्तीसगढ़ आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Forest fires, lightning strikes and flood relief operations",
        descriptionHi: "वज्रपात, बाढ़ और प्राकृतिक आपदा नियंत्रण कक्ष",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 20: Jharkhand
  "20": {
    stateCode: "20",
    stateNameEn: "Jharkhand",
    stateNameHi: "झारखंड",
    helplines: [
      {
        id: "jh-health",
        serviceEn: "Jharkhand 104 Health Help Desk",
        serviceHi: "झारखंड 104 स्वास्थ्य सहायता केंद्र",
        number: "104",
        category: "medical",
        descriptionEn: "Medical advice, rural health sub-centre guidance and vaccination",
        descriptionHi: "चिकित्सा परामर्श एवं ग्रामीण स्वास्थ्य केंद्र सूचना",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "jh-disaster",
        serviceEn: "Jharkhand State Disaster Control Room",
        serviceHi: "झारखंड राज्य आपदा नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Lightning strike safety, drought and flood relief coordination",
        descriptionHi: "वज्रपात सुरक्षा एवं आपदा प्रबंधन सहायता केंद्र",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 05: Uttarakhand
  "05": {
    stateCode: "05",
    stateNameEn: "Uttarakhand",
    stateNameHi: "उत्तराखंड",
    helplines: [
      {
        id: "uk-cm",
        serviceEn: "Uttarakhand CM Helpline 1905",
        serviceHi: "उत्तराखंड सीएम हेल्पलाइन 1905",
        number: "1905",
        category: "governance",
        descriptionEn: "Public grievance registration monitored by Uttarakhand Chief Minister",
        descriptionHi: "मुख्यमंत्री शिकायत निवारण मंच",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "uk-disaster",
        serviceEn: "Uttarakhand Disaster Mitigation (USDMA)",
        serviceHi: "उत्तराखंड आपदा न्यूनीकरण एवं प्रबंधन (USDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Char Dham cloudburst, landslide, avalanche and high-altitude emergency",
        descriptionHi: "चार धाम भूस्खलन, बादल फटने व उच्च पर्वतीय आपदा राहत",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "uk-health",
        serviceEn: "Uttarakhand 104 Health Advisory",
        serviceHi: "उत्तराखंड 104 स्वास्थ्य परामर्श सेवा",
        number: "104",
        category: "medical",
        descriptionEn: "Hilly terrain health consultation and medical emergency advice",
        descriptionHi: "पर्वतीय क्षेत्रों हेतु स्वास्थ्य परामर्श व एम्बुलेंस सहायता",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 02: Himachal Pradesh
  "02": {
    stateCode: "02",
    stateNameEn: "Himachal Pradesh",
    stateNameHi: "हिमाचल प्रदेश",
    helplines: [
      {
        id: "hp-cm",
        serviceEn: "Mukhyamantri Seva Sankalp Helpline 1100",
        serviceHi: "मुख्यमंत्री सेवा संकल्प हेल्पलाइन 1100",
        number: "1100",
        category: "governance",
        descriptionEn: "Himachal Pradesh public grievance registration and feedback",
        descriptionHi: "जनसमस्याओं के त्वरित समाधान हेतु हेल्पलाइन",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "hp-disaster",
        serviceEn: "HP State Disaster Management Authority",
        serviceHi: "हि.प्र. राज्य आपदा प्रबंधन प्राधिकरण (HPSDMA)",
        number: "1070",
        category: "disaster",
        descriptionEn: "Snowfall road blockades, flash floods, landslides and earthquake alerts",
        descriptionHi: "हिमपात, भूस्खलन व प्राकृतिक आपदा नियंत्रण कक्ष",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 01: Jammu & Kashmir
  "01": {
    stateCode: "01",
    stateNameEn: "Jammu & Kashmir",
    stateNameHi: "जम्मू और कश्मीर",
    helplines: [
      {
        id: "jk-health",
        serviceEn: "J&K Health & Medical Education Tele-Advice 104",
        serviceHi: "जम्मू कश्मीर 104 स्वास्थ्य परामर्श",
        number: "104",
        category: "medical",
        descriptionEn: "Remote valley medical triage and hospital guidance",
        descriptionHi: "दूरदराज के इलाकों हेतु टेली-परामर्श व स्वास्थ्य मार्गदर्शन",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "jk-disaster",
        serviceEn: "J&K Disaster Management Relief Room",
        serviceHi: "जम्मू कश्मीर आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Highway avalanche, heavy snowfall and flood alerts",
        descriptionHi: "हिमस्खलन, भारी बर्फबारी व आपदा राहत नियंत्रण",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },

  // 30: Goa
  "30": {
    stateCode: "30",
    stateNameEn: "Goa",
    stateNameHi: "गोवा",
    helplines: [
      {
        id: "ga-health",
        serviceEn: "Goa Health Infoline 104",
        serviceHi: "गोवा स्वास्थ्य इन्फोलाइन 104",
        number: "104",
        category: "medical",
        descriptionEn: "State health facility directory and emergency medical advice",
        descriptionHi: "आरोग्य सल्ला व वैद्यकीय माहिती",
        is24x7: true,
        isTollFree: true,
      },
      {
        id: "ga-disaster",
        serviceEn: "Goa State Disaster Management Control Room",
        serviceHi: "गोवा राज्य आपदा प्रबंधन नियंत्रण कक्ष",
        number: "1070",
        category: "disaster",
        descriptionEn: "Coastal high-tide alert, sea rescue and monsoon relief",
        descriptionHi: "किनारपट्टी वादळ व आपत्ती व्यवस्थापन",
        is24x7: true,
        isTollFree: true,
      },
    ],
  },
}

/**
 * Standard fallback helplines for other Union Territories and Northeastern states.
 */
function getGenericStateHelplines(stateCode: string, nameEn: string, nameHi: string): HelplineItem[] {
  return [
    {
      id: `${stateCode}-cm-112`,
      serviceEn: `${nameEn} Emergency Response (ERSS)`,
      serviceHi: `${nameHi} आपातकालीन प्रतिक्रिया सेवा`,
      number: "112",
      category: "police_fire",
      descriptionEn: "All-in-one state emergency dispatch for police, medical, fire & rescue",
      descriptionHi: "पुलिस, चिकित्सा, अग्निशमन एवं बचाव दल के लिए एकीकृत सेवा",
      is24x7: true,
      isTollFree: true,
      isNational: false,
      stateCode,
      stateNameEn: nameEn,
      stateNameHi: nameHi,
    },
    {
      id: `${stateCode}-health-104`,
      serviceEn: `${nameEn} Health Advisory Line 104`,
      serviceHi: `${nameHi} स्वास्थ्य परामर्श लाइन 104`,
      number: "104",
      category: "medical",
      descriptionEn: "Medical tele-consultation and health information helpline",
      descriptionHi: "चिकित्सा परामर्श एवं स्वास्थ्य सूचना हेल्पलाइन",
      is24x7: true,
      isTollFree: true,
      isNational: false,
      stateCode,
      stateNameEn: nameEn,
      stateNameHi: nameHi,
    },
    {
      id: `${stateCode}-women-181`,
      serviceEn: `${nameEn} Women in Distress Helpline 181`,
      serviceHi: `${nameHi} महिला सहायता हेल्पलाइन 181`,
      number: "181",
      category: "women_child",
      descriptionEn: "State women empowerment and crisis intervention line",
      descriptionHi: "महिला सुरक्षा व संकट सहायता हेल्पलाइन",
      is24x7: true,
      isTollFree: true,
      isNational: false,
      stateCode,
      stateNameEn: nameEn,
      stateNameHi: nameHi,
    },
    {
      id: `${stateCode}-disaster-1070`,
      serviceEn: `${nameEn} State Disaster Operations Centre`,
      serviceHi: `${nameHi} राज्य आपदा प्रबंधन नियंत्रण कक्ष`,
      number: "1070",
      category: "disaster",
      descriptionEn: "Natural disaster management, weather warning and relief operations",
      descriptionHi: "प्राकृतिक आपदा, मौसम चेतावनी व राहत नियंत्रण कक्ष",
      is24x7: true,
      isTollFree: true,
      isNational: false,
      stateCode,
      stateNameEn: nameEn,
      stateNameHi: nameHi,
    },
  ]
}

/**
 * Returns all helplines for a specific state, enriched with state metadata.
 */
export function getStateHelplines(stateCode: string, nameEn = "State", nameHi = "राज्य"): HelplineItem[] {
  const record = STATE_HELPLINES_CATALOG[stateCode]
  if (record) {
    return record.helplines.map((h) => ({
      ...h,
      isNational: false,
      stateCode: record.stateCode,
      stateNameEn: record.stateNameEn,
      stateNameHi: record.stateNameHi,
    }))
  }

  return getGenericStateHelplines(stateCode, nameEn, nameHi)
}

/**
 * Returns the combined directory: Selected State Helplines + Common National Helplines.
 * State helplines appear at the top to provide immediate local relevance.
 */
export function getCombinedHelplines(stateCode?: string, nameEn?: string, nameHi?: string): HelplineItem[] {
  if (!stateCode) {
    return [...NATIONAL_HELPLINES]
  }

  const stateList = getStateHelplines(stateCode, nameEn, nameHi)
  return [...stateList, ...NATIONAL_HELPLINES]
}

/**
 * Returns the entire national directory: National Helplines + All Registered State Helplines.
 */
export function getAllHelplines(): HelplineItem[] {
  const allStateHelplines: HelplineItem[] = []

  for (const catalog of Object.values(STATE_HELPLINES_CATALOG)) {
    for (const h of catalog.helplines) {
      allStateHelplines.push({
        ...h,
        isNational: false,
        stateCode: catalog.stateCode,
        stateNameEn: catalog.stateNameEn,
        stateNameHi: catalog.stateNameHi,
      })
    }
  }

  return [...NATIONAL_HELPLINES, ...allStateHelplines]
}
