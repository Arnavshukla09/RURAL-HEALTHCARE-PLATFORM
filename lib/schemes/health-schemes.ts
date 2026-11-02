/**
 * lib/schemes/health-schemes.ts
 *
 * Comprehensive National & State Government Healthcare Schemes Directory
 * Verified across MoHFW, NHM, NHA, National Trust, and State Health Departments.
 */

export type SchemeScope = "national" | "state"

export type SchemeCategory = 
  | "all"
  | "kids"
  | "females"
  | "elderly"
  | "disability"
  | "cancer"
  | "rare_disease"
  | "kidney"
  | "tb"
  | "mental_health"
  | "poverty_upliftment"
  | "emergency_trauma"

export interface GovernmentHealthScheme {
  id: string
  titleEn: string
  titleHi: string
  scope: SchemeScope
  stateCode?: string // LGD state code, e.g. "23" for MP, "27" for MH, "07" for Delhi, etc.
  stateNameEn?: string
  stateNameHi?: string
  departmentEn: string
  departmentHi: string
  targetBeneficiariesEn: string
  targetBeneficiariesHi: string
  categories: SchemeCategory[]
  descriptionEn: string
  descriptionHi: string
  benefitsEn: string[]
  benefitsHi: string[]
  coverageAmount: string // e.g. "₹5,00,000 / year", "₹25,00,000 / year", "₹50,00,000 grant", "100% Free"
  eligibilityEn: string
  eligibilityHi: string
  contactPhone: string
  contactWeb: string
  applicationModeEn: string
  applicationModeHi: string
  themeColor: {
    badgeBg: string
    badgeText: string
    border: string
    cardBg: string
    iconBg: string
    iconColor: string
  }
  badgeTagEn?: string
  badgeTagHi?: string
}

export const CATEGORY_FILTERS: { key: SchemeCategory; labelEn: string; labelHi: string; iconName: string }[] = [
  { key: "all", labelEn: "All Schemes", labelHi: "सभी योजनाएं", iconName: "Filter" },
  { key: "kids", labelEn: "Kids & Infants", labelHi: "शिशु व बाल स्वास्थ्य", iconName: "Baby" },
  { key: "females", labelEn: "Maternal & Women", labelHi: "महिला एवं मातृत्व", iconName: "Heart" },
  { key: "elderly", labelEn: "Senior Citizens (70+)", labelHi: "वरिष्ठ नागरिक (70+)", iconName: "Users" },
  { key: "disability", labelEn: "Paralysis & Disability", labelHi: "लकवा व दिव्यांगता", iconName: "Accessibility" },
  { key: "cancer", labelEn: "Cancer & Oncology", labelHi: "कैंसर एवं ऑन्कोलॉजी", iconName: "Ribbon" },
  { key: "rare_disease", labelEn: "Rare Diseases", labelHi: "दुर्लभ रोग (₹50 लाख)", iconName: "Dna" },
  { key: "kidney", labelEn: "Kidney & Dialysis", labelHi: "किडनी व डायलिसिस", iconName: "Activity" },
  { key: "tb", labelEn: "Tuberculosis (TB)", labelHi: "टीबी (निक्षय योजना)", iconName: "Stethoscope" },
  { key: "mental_health", labelEn: "Mental Health", labelHi: "मानसिक स्वास्थ्य (14416)", iconName: "Brain" },
  { key: "poverty_upliftment", labelEn: "Universal & BPL Cover", labelHi: "सार्वभौमिक व बीपीएल", iconName: "ShieldCheck" },
  { key: "emergency_trauma", labelEn: "Emergency & Accidents", labelHi: "आपातकाल व दुर्घटना", iconName: "Zap" },
]

export const HEALTH_SCHEMES: GovernmentHealthScheme[] = [
  // ==========================================
  // NATIONAL SCHEMES (CENTRAL GOVERNMENT)
  // ==========================================
  {
    id: "ayushman-pmjay",
    titleEn: "Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    titleHi: "आयुष्मान भारत — प्रधानमंत्री जन आरोग्य योजना (PM-JAY)",
    scope: "national",
    departmentEn: "National Health Authority (NHA) & MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA) एवं स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "Bottom 40% vulnerable and poor families (12+ Crore households)",
    targetBeneficiariesHi: "निचले 40% गरीब व कमजोर परिवार (12+ करोड़ परिवार)",
    categories: ["poverty_upliftment"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "The world's largest government-funded health assurance scheme, providing comprehensive cashless coverage for secondary and tertiary care hospitalization across 27,000+ public and private empanelled hospitals.",
    descriptionHi: "दुनिया की सबसे बड़ी सरकारी स्वास्थ्य आश्वासन योजना, जो 27,000+ सूचीबद्ध सरकारी व निजी अस्पतालों में माध्यमिक व तृतीयक अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का कैशलेस कवर देती है।",
    benefitsEn: [
      "Up to ₹5,00,000 health cover per family per year on a family-floater basis",
      "Completely cashless and paperless treatment at all empanelled hospitals pan-India",
      "Covers 1,949 medical and surgical procedures across 27 major specialties",
      "Pre-hospitalization expenses up to 3 days and post-hospitalization up to 15 days included",
      "No restriction on family size, age, or gender; pre-existing conditions covered from day 1"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 का निःशुल्क पारिवारिक फ्लोटर स्वास्थ्य कवर",
      "देशभर के सभी सूचीबद्ध अस्पतालों में पूरी तरह से कैशलेस और पेपरलेस इलाज",
      "27 प्रमुख विशेषताओं में 1,949 मेडिकल और सर्जिकल उपचार प्रक्रियाएं शामिल",
      "अस्पताल में भर्ती से 3 दिन पहले और छुट्टी के बाद 15 दिनों तक की दवाएं व जांचें शामिल",
      "परिवार के आकार, आयु या लिंग पर कोई सीमा नहीं; पहले से मौजूद बीमारियां पहले दिन से कवर"
    ],
    eligibilityEn: "Families identified under Socio-Economic Caste Census (SECC 2011) deprivation criteria or active NFSA ration card holders.",
    eligibilityHi: "SECC 2011 सामाजिक-आर्थिक जाति जनगणना के अभाव मानदंडों या सक्रिय NFSA राशन कार्ड के तहत चिन्हित परिवार।",
    contactPhone: "14555 / 1800-111-565",
    contactWeb: "pmjay.gov.in",
    applicationModeEn: "Aadhaar e-KYC via PM-JAY Beneficiary Portal, Ayushman App, or nearest CSC / Govt Hospital",
    applicationModeHi: "पीएम-जय लाभार्थी पोर्टल, आयुष्मान ऐप, या नजदीकी सीएससी / सरकारी अस्पताल में आधार ई-केवाईसी",
    themeColor: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800 border-emerald-200",
      border: "border-emerald-300",
      cardBg: "bg-emerald-50/10",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700"
    },
    badgeTagEn: "National Flagship",
    badgeTagHi: "राष्ट्रीय फ्लैगशिप"
  },
  {
    id: "ayushman-vaya-vandana",
    titleEn: "Ayushman Vaya Vandana Card (Senior Citizens 70+)",
    titleHi: "आयुष्मान वय वंदना कार्ड (70 वर्ष से अधिक वरिष्ठ नागरिक)",
    scope: "national",
    departmentEn: "National Health Authority (NHA) & MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य प्राधिकरण (NHA) एवं स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "All Indian Citizens aged 70 years and above, irrespective of income",
    targetBeneficiariesHi: "70 वर्ष और उससे अधिक आयु के सभी भारतीय नागरिक, आय सीमा के बिना",
    categories: ["elderly", "poverty_upliftment"],
    coverageAmount: "₹5,00,000 / individual / year",
    descriptionEn: "Universal healthcare expansion approved by the Union Cabinet granting a dedicated ₹5 Lakh annual health insurance cover to every senior citizen aged 70+ across India, without any income or wealth limitations.",
    descriptionHi: "केंद्रीय मंत्रिमंडल द्वारा स्वीकृत सार्वभौमिक स्वास्थ्य योजना, जो भारत के 70 वर्ष से अधिक आयु के प्रत्येक वरिष्ठ नागरिक को बिना किसी आय या संपत्ति सीमा के ₹5 लाख का समर्पित वार्षिक स्वास्थ्य बीमा कवर देती है।",
    benefitsEn: [
      "Distinct ₹5,00,000 annual health cover exclusively for the senior citizen",
      "If family is already in PM-JAY, senior gets an exclusive extra ₹5 Lakh top-up not shared with others",
      "Covers all pre-existing conditions from Day 1 (cardiac, joints, diabetes, hypertension, dialysis)",
      "Interoperable with private mediclaim and ESI; switch option for CGHS / ECHS beneficiaries",
      "Instant digital card issuance via Aadhaar face/OTP e-KYC"
    ],
    benefitsHi: [
      "वरिष्ठ नागरिक के लिए विशेष रूप से ₹5,00,000 का समर्पित वार्षिक स्वास्थ्य कवर",
      "यदि परिवार पहले से पीएम-जय में है, तो 70+ बुजुर्ग को अलग से ₹5 लाख का अतिरिक्त टॉप-अप मिलता है",
      "पहले दिन से सभी पुरानी बीमारियां कवर (हृदय, जोड़, मधुमेह, उच्च रक्तचाप, डायलिसिस)",
      "निजी मेडिक्लेम और ईएसआई के साथ भी वैध; सीजीएचएस/ईसीएचएस से स्विच करने का विकल्प",
      "आधार फेस या ओटीपी ई-केवाईसी के माध्यम से तुरंत डिजिटल कार्ड डाउनलोड"
    ],
    eligibilityEn: "Any Indian citizen who has completed 70 years of age (verified via Aadhaar date of birth).",
    eligibilityHi: "कोई भी भारतीय नागरिक जिसने 70 वर्ष की आयु पूरी कर ली हो (आधार कार्ड जन्मतिथि से सत्यापित)।",
    contactPhone: "14555",
    contactWeb: "beneficiary.nha.gov.in",
    applicationModeEn: "Apply online at beneficiary.nha.gov.in or via the Ayushman App using Aadhaar e-KYC",
    applicationModeHi: "beneficiary.nha.gov.in या आयुष्मान ऐप पर आधार ई-केवाईसी के जरिए ऑनलाइन आवेदन करें",
    themeColor: {
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-800 border-amber-200",
      border: "border-amber-300",
      cardBg: "bg-amber-50/15",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700"
    },
    badgeTagEn: "Universal 70+",
    badgeTagHi: "सार्वभौमिक 70+"
  },
  {
    id: "niramaya-health-insurance",
    titleEn: "Niramaya Health Insurance Scheme (Paralysis & Disabilities)",
    titleHi: "निरामय स्वास्थ्य बीमा योजना (लकवा एवं दिव्यांगता)",
    scope: "national",
    departmentEn: "The National Trust (Dept. of Empowerment of PwD, Ministry of Social Justice)",
    departmentHi: "द नेशनल ट्रस्ट (दिव्यांगजन सशक्तिकरण विभाग, सामाजिक न्याय मंत्रालय)",
    targetBeneficiariesEn: "Persons with Cerebral Palsy, Multiple Disabilities, Autism & Spastic Paralysis",
    targetBeneficiariesHi: "सेरेब्रल पाल्सी, बहु-दिव्यांगता, ऑटिज्म एवं पक्षाघात/लकवा से पीड़ित व्यक्ति",
    categories: ["disability"],
    coverageAmount: "Up to ₹1,00,000 / year",
    descriptionEn: "Comprehensive health insurance scheme designed specifically to support people with severe developmental disorders, paralysis associated with cerebral palsy, and multiple disabilities through surgeries, ongoing therapies, and OPD.",
    descriptionHi: "गंभीर विकासात्मक विकारों, सेरेब्रल पाल्सी से जुड़े पक्षाघात और बहु-दिव्यांगता वाले व्यक्तियों के लिए सर्जरी, निरंतर थेरेपी और ओपीडी उपचार प्रदान करने वाली विशेष स्वास्थ्य बीमा योजना।",
    benefitsEn: [
      "₹1,00,000 annual health cover with no pre-insurance medical examination",
      "Corrective surgeries for congenital or paralysis-related deformities up to ₹40,000",
      "Hospitalization expenses (surgical up to ₹40k, non-surgical up to ₹15k)",
      "Ongoing physiotherapy, occupational therapy, and speech therapy covered up to ₹20,000",
      "Regular OPD consultations, diagnostics, and medicines up to ₹19,000",
      "Transportation allowance for therapy and hospital visits covered up to ₹2,000/year"
    ],
    benefitsHi: [
      "बिना किसी पूर्व मेडिकल जांच के ₹1,00,000 का वार्षिक स्वास्थ्य बीमा कवर",
      "जन्मजात या पक्षाघात विकृतियों के लिए सुधारात्मक सर्जरी ₹40,000 तक कवर",
      "अस्पताल में भर्ती खर्च (सर्जिकल ₹40,000 तक, गैर-सर्जिकल ₹15,000 तक)",
      "निरंतर फिजियोथेरेपी, ऑक्यूपेशनल थेरेपी और स्पीच थेरेपी ₹20,000 तक कवर",
      "ओपीडी डॉक्टर परामर्श, जांच और दवाएं ₹19,000 तक कवर",
      "अस्पताल और थेरेपी केंद्र जाने के लिए ₹2,000/वर्ष तक यात्रा भत्ता"
    ],
    eligibilityEn: "Persons with valid Disability Certificate or UDID Card indicating Cerebral Palsy, Autism, or Multiple Disabilities under the National Trust Act.",
    eligibilityHi: "नेशनल ट्रस्ट एक्ट के तहत सेरेब्रल पाल्सी, ऑटिज्म, या बहु-दिव्यांगता दर्शाने वाले वैध दिव्यांगता प्रमाण पत्र या UDID कार्ड धारक।",
    contactPhone: "011-43187878 / 011-20892053",
    contactWeb: "thenationaltrust.gov.in",
    applicationModeEn: "Apply online through Registered Organisations (ROs) on thenationaltrust.gov.in",
    applicationModeHi: "thenationaltrust.gov.in पर पंजीकृत संस्थाओं (RO) के माध्यम से ऑनलाइन आवेदन करें",
    themeColor: {
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-800 border-indigo-200",
      border: "border-indigo-300",
      cardBg: "bg-indigo-50/15",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700"
    },
    badgeTagEn: "Disability & Rehab",
    badgeTagHi: "दिव्यांगता एवं पुनर्वास"
  },
  {
    id: "rashtriya-arogya-nidhi-cancer",
    titleEn: "Health Minister's Cancer Patient Fund (HMCPF / RAN)",
    titleHi: "स्वास्थ्य मंत्री कैंसर रोगी कोष (HMCPF / राष्ट्रीय आरोग्य निधि)",
    scope: "national",
    departmentEn: "Ministry of Health and Family Welfare (MoHFW)",
    departmentHi: "स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार",
    targetBeneficiariesEn: "Underprivileged and BPL cancer patients requiring tertiary oncology treatment",
    targetBeneficiariesHi: "गरीब व बीपीएल कैंसर रोगी जिन्हें तृतीयक कैंसर देखभाल की आवश्यकता है",
    categories: ["cancer"],
    coverageAmount: "Up to ₹15,00,000 one-time grant",
    descriptionEn: "Financial grant initiative under Rashtriya Arogya Nidhi providing up to ₹15 Lakh for life-saving chemotherapy, radiation therapy, and surgical oncology treatments across 27 designated Regional Cancer Centres (RCCs).",
    descriptionHi: "राष्ट्रीय आरोग्य निधि के तहत वित्तीय अनुदान पहल जो 27 क्षेत्रीय कैंसर केंद्रों (RCC) में कीमोथेरेपी, विकिरण थेरेपी और सर्जिकल ऑन्कोलॉजी उपचार के लिए ₹15 लाख तक की वित्तीय सहायता देती है।",
    benefitsEn: [
      "Direct financial grant up to ₹15,00,000 for critical cancer treatment",
      "Revolving funds of up to ₹50 Lakhs placed at Regional Cancer Centres for zero-delay emergency approvals",
      "Covers specialized chemotherapy drugs, radiation cycles, targeted immunotherapy, and surgical resection",
      "Direct disbursement to the treating government institute without bureaucratic deductions",
      "Also covers patients whose cancer therapies exceed standard PM-JAY package thresholds"
    ],
    benefitsHi: [
      "गंभीर कैंसर उपचार के लिए सीधे ₹15,00,000 तक का वित्तीय अनुदान",
      "तत्काल आपातकालीन उपचार हेतु क्षेत्रीय कैंसर केंद्रों पर ₹50 लाख तक के रिवाल्विंग फंड स्थापित",
      "कीमोथेरेपी दवाएं, रेडिएशन साइकिल, टारगेटेड इम्यूनोथेरेपी और सर्जरी का संपूर्ण खर्च कवर",
      "उपचार करने वाले सरकारी कैंसर संस्थान को सीधे फंड का हस्तांतरण",
      "ऐसे मामलों में भी लागू जहां कैंसर का खर्च सामान्य पीएम-जय पैकेज सीमा से अधिक हो जाता है"
    ],
    eligibilityEn: "Cancer patients belonging to families living Below Poverty Line (BPL/NFSA/AAY) being treated at designated Government Medical Colleges or Regional Cancer Centres.",
    eligibilityHi: "गरीबी रेखा से नीचे (BPL/NFSA/AAY) रहने वाले कैंसर रोगी जिनका इलाज सरकारी मेडिकल कॉलेज या क्षेत्रीय कैंसर केंद्र में चल रहा हो।",
    contactPhone: "011-23061986 / 011-23063496",
    contactWeb: "mohfw.gov.in",
    applicationModeEn: "Generated by Medical Superintendent of the treating Regional Cancer Centre via NHA TMS portal",
    applicationModeHi: "उपचार करने वाले क्षेत्रीय कैंसर केंद्र के मेडिकल सुपरिंटेंडेंट द्वारा NHA TMS पोर्टल पर आवेदन",
    themeColor: {
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-800 border-rose-200",
      border: "border-rose-300",
      cardBg: "bg-rose-50/15",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700"
    },
    badgeTagEn: "Cancer Lifeline",
    badgeTagHi: "कैंसर सहायता कोष"
  },
  {
    id: "national-policy-rare-diseases",
    titleEn: "National Policy for Rare Diseases (NPRD Financial Support)",
    titleHi: "दुर्लभ रोगों के लिए राष्ट्रीय नीति (NPRD ₹50 लाख वित्तीय सहायता)",
    scope: "national",
    departmentEn: "Rare Diseases Cell, Ministry of Health & Family Welfare",
    departmentHi: "दुर्लभ रोग प्रकोष्ठ, स्वास्थ्य एवं परिवार कल्याण मंत्रालय",
    targetBeneficiariesEn: "Patients suffering from recognized rare genetic & metabolic disorders",
    targetBeneficiariesHi: "मान्यता प्राप्त दुर्लभ आनुवंशिक व चयापचय विकारों से पीड़ित रोगी",
    categories: ["rare_disease"],
    coverageAmount: "Up to ₹50,00,000 one-time grant",
    descriptionEn: "Central financial assistance of up to ₹50 Lakhs per patient for life-saving curative therapy, enzyme replacement, or bone marrow transplantation at 12 premier designated Centres of Excellence (AIIMS, PGI, etc.).",
    descriptionHi: "12 प्रमुख नामित उत्कृष्टता केंद्रों (एम्स, पीजीआई, आदि) में दुर्लभ आनुवंशिक रोगों, एंजाइम रिप्लेसमेंट और बोन मैरो ट्रांसप्लांट के लिए प्रति रोगी ₹50 लाख तक की वित्तीय सहायता।",
    benefitsEn: [
      "Substantial one-time financial assistance of up to ₹50,00,000 per patient",
      "Disbursed directly to designated Centres of Excellence (CoEs) for high-cost orphan drugs and procedures",
      "Covers Lysosomal Storage Disorders, Gaucher disease, Pompe disease, MPS, and Spinal Muscular Atrophy (SMA)",
      "Dedicated digital portal for crowd-funding and institutional rare disease tracking",
      "Integrated screening and prenatal diagnosis at apex genetic labs"
    ],
    benefitsHi: [
      "प्रति रोगी ₹50,00,000 तक की बड़ी एकमुश्त केंद्रीय वित्तीय सहायता",
      "उच्च लागत वाली दवाओं और प्रक्रियाओं के लिए नामित उत्कृष्टता केंद्रों (CoE) को सीधे भुगतान",
      "गौचर, पोम्पे, एमपीएस, स्पाइनल मस्कुलर एट्रोफी (SMA) और लाइसोसोमल स्टोरेज रोग शामिल",
      "दुर्लभ बीमारी ट्रैकिंग और क्राउड-फंडिंग के लिए समर्पित डिजिटल पोर्टल",
      "शीर्ष जेनेटिक लैब में एकीकृत जांच और प्रसव पूर्व निदान की सुविधा"
    ],
    eligibilityEn: "Indian citizens diagnosed with eligible rare diseases seeking treatment at designated government Centres of Excellence (CoEs).",
    eligibilityHi: "नामित सरकारी उत्कृष्टता केंद्रों (CoE) में उपचार प्राप्त करने वाले और पात्र दुर्लभ रोग से पीड़ित भारतीय नागरिक।",
    contactPhone: "011-23061481",
    contactWeb: "rarediseases.mohfw.gov.in",
    applicationModeEn: "Direct evaluation and digital registration by treating clinician at designated Centre of Excellence (CoE)",
    applicationModeHi: "नामित उत्कृष्टता केंद्र (CoE) में विशेषज्ञ डॉक्टर द्वारा नैदानिक मूल्यांकन और डिजिटल पंजीकरण",
    themeColor: {
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-800 border-purple-200",
      border: "border-purple-300",
      cardBg: "bg-purple-50/15",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700"
    },
    badgeTagEn: "Rare Disease Grant",
    badgeTagHi: "दुर्लभ रोग अनुदान"
  },
  {
    id: "national-dialysis-programme",
    titleEn: "Pradhan Mantri National Dialysis Programme (PMNDP)",
    titleHi: "प्रधानमंत्री राष्ट्रीय डायलिसिस कार्यक्रम (PMNDP)",
    scope: "national",
    departmentEn: "National Health Mission (NHM) & MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य मिशन (NHM) एवं स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "End-Stage Renal Disease (ESRD) and chronic kidney failure patients",
    targetBeneficiariesHi: "एंड-स्टेज रीनल डिजीज (ESRD) और क्रोनिक किडनी फेलियर के रोगी",
    categories: ["kidney", "poverty_upliftment"],
    coverageAmount: "100% Free for BPL patients",
    descriptionEn: "National initiative providing free life-saving Hemodialysis and Peritoneal Dialysis services to economically weak patients across 600+ district hospitals throughout India, eliminating out-of-pocket costs.",
    descriptionHi: "देशभर के 600+ जिला अस्पतालों में आर्थिक रूप से कमजोर मरीजों को मुफ्त हेमोडायलिसिस और पेरिटोनियल डायलिसिस सेवाएं प्रदान करने वाली राष्ट्रीय पहल।",
    benefitsEn: [
      "100% free hemodialysis sessions for Below Poverty Line (BPL) cardholders",
      "Subsidized, highly affordable fixed rates for non-BPL patients",
      "Peritoneal Dialysis (PD) support for patients requiring home-based daily dialysis",
      "Operational in 600+ District Hospitals across 36 States and UTs",
      "Saves ₹2,000 to ₹3,500 per dialysis session compared to private commercial clinics"
    ],
    benefitsHi: [
      "गरीबी रेखा से नीचे (BPL) कार्डधारकों के लिए 100% मुफ्त हेमोडायलिसिस सत्र",
      "गैर-बीपीएल मरीजों के लिए भी निजी अस्पतालों की तुलना में अत्यधिक रियायती दरें",
      "घर पर दैनिक डायलिसिस कराने वाले मरीजों के लिए पेरिटोनियल डायलिसिस (PD) सहायता",
      "36 राज्यों और केंद्र शासित प्रदेशों के 600+ जिला अस्पतालों में संचालित",
      "निजी केंद्रों की तुलना में प्रति डायलिसिस ₹2,000 से ₹3,500 की सीधी बचत"
    ],
    eligibilityEn: "Patients suffering from chronic renal failure requiring maintenance dialysis with valid BPL ration card or income certificate.",
    eligibilityHi: "क्रोनिक किडनी फेलियर से पीड़ित मरीज जिन्हें नियमित डायलिसिस की आवश्यकता है, वैध बीपीएल कार्ड या आय प्रमाण पत्र के साथ।",
    contactPhone: "104 / 14555",
    contactWeb: "nhm.gov.in",
    applicationModeEn: "Direct walk-in registration at District Hospital Dialysis Unit with nephrologist referral and BPL proof",
    applicationModeHi: "नेफ्रोलॉजिस्ट रेफरल और बीपीएल प्रमाण के साथ जिला अस्पताल डायलिसिस यूनिट में सीधा पंजीकरण",
    themeColor: {
      badgeBg: "bg-cyan-50",
      badgeText: "text-cyan-800 border-cyan-200",
      border: "border-cyan-300",
      cardBg: "bg-cyan-50/15",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-700"
    },
    badgeTagEn: "Free Dialysis",
    badgeTagHi: "मुफ्त डायलिसिस"
  },
  {
    id: "janani-suraksha-yojana",
    titleEn: "Janani Suraksha Yojana (JSY)",
    titleHi: "जननी सुरक्षा योजना (JSY)",
    scope: "national",
    departmentEn: "National Health Mission (NHM), MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य मिशन (NHM), स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "Pregnant women from rural and urban low-income families",
    targetBeneficiariesHi: "ग्रामीण व शहरी निम्न आय वर्ग की गर्भवती महिलाएं",
    categories: ["females"],
    coverageAmount: "₹1,400 Rural / ₹1,000 Urban cash incentive",
    descriptionEn: "A safe motherhood intervention under the National Health Mission that promotes institutional deliveries among poor pregnant women through direct cash transfers, drastically reducing maternal and neonatal mortality.",
    descriptionHi: "राष्ट्रीय स्वास्थ्य मिशन के तहत सुरक्षित मातृत्व योजना जो गरीब गर्भवती महिलाओं में प्रत्यक्ष नकद हस्तांतरण द्वारा संस्थागत प्रसव को बढ़ावा देकर मातृ व शिशु मृत्यु दर को कम करती है।",
    benefitsEn: [
      "Cash incentive of ₹1,400 for rural mothers delivering in public health facilities",
      "Cash incentive of ₹1,000 for urban mothers delivering in public health facilities",
      "Cash assistance of ₹500 for BPL women choosing home delivery (low-performing states)",
      "ASHA worker incentive (₹600 rural, ₹400 urban) for accompanying and assisting mother",
      "Direct Benefit Transfer (DBT) credited directly into mother's bank account"
    ],
    benefitsHi: [
      "सरकारी स्वास्थ्य केंद्र में प्रसव कराने वाली ग्रामीण माताओं को ₹1,400 की नकद सहायता",
      "सरकारी स्वास्थ्य केंद्र में प्रसव कराने वाली शहरी माताओं को ₹1,000 की नकद सहायता",
      "घर पर प्रसव कराने वाली बीपीएल माताओं को ₹500 की सहायता",
      "अस्पताल लाने और देखभाल के लिए आशा कार्यकर्ता को प्रोत्साहन राशि (₹600 ग्रामीण, ₹400 शहरी)",
      "प्रसव के तुरंत बाद सीधे माता के बैंक खाते में डायरेक्ट बेनिफिट ट्रांसफर (DBT)"
    ],
    eligibilityEn: "All pregnant women delivering in government health facilities in Low-Performing States (LPS); BPL/SC/ST pregnant women in High-Performing States.",
    eligibilityHi: "कम प्रदर्शन करने वाले राज्यों (LPS) में सरकारी केंद्रों में प्रसव कराने वाली सभी महिलाएं; अन्य राज्यों में BPL/SC/ST महिलाएं।",
    contactPhone: "104 (Health Helpline)",
    contactWeb: "nhm.gov.in",
    applicationModeEn: "Registration during ANC check-up with local ASHA worker or nearest PHC/CHC",
    applicationModeHi: "स्थानीय आशा कार्यकर्ता या नजदीकी प्राथमिक/सामुदायिक स्वास्थ्य केंद्र पर प्रसव पूर्व जांच (ANC) में पंजीकरण",
    themeColor: {
      badgeBg: "bg-pink-50",
      badgeText: "text-pink-800 border-pink-200",
      border: "border-pink-300",
      cardBg: "bg-pink-50/15",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-700"
    },
    badgeTagEn: "Safe Motherhood",
    badgeTagHi: "सुरक्षित मातृत्व"
  },
  {
    id: "janani-shishu-suraksha",
    titleEn: "Janani Shishu Suraksha Karyakaram (JSSK)",
    titleHi: "जननी शिशु सुरक्षा कार्यक्रम (JSSK)",
    scope: "national",
    departmentEn: "National Health Mission (NHM), MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य मिशन (NHM), स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "All pregnant women & sick infants (up to 1 year) in public facilities",
    targetBeneficiariesHi: "सरकारी अस्पतालों में सभी गर्भवती महिलाएं एवं 1 वर्ष तक के बीमार नवजात शिशु",
    categories: ["females", "kids"],
    coverageAmount: "100% Free (Zero Out-of-Pocket Expense)",
    descriptionEn: "National entitlement program guaranteeing completely free and cashless delivery (including C-sections) for pregnant mothers and free treatment for sick infants up to 1 year of age in all public health institutions.",
    descriptionHi: "राष्ट्रीय अधिकार कार्यक्रम जो सभी सरकारी स्वास्थ्य संस्थानों में गर्भवती महिलाओं के लिए मुफ्त प्रसव (सी-सेक्शन सहित) और 1 वर्ष तक के बीमार शिशुओं के संपूर्ण मुफ्त इलाज की गारंटी देता है।",
    benefitsEn: [
      "Absolutely free delivery, including normal deliveries and Caesarean sections",
      "Free medicines, consumables, IV fluids, and surgical implants during hospital stay",
      "Free essential laboratory diagnostics (blood tests, urine tests, ultrasound)",
      "Free blood provision and transfusion whenever clinically indicated",
      "Free nutritious diet for mother during hospital stay (up to 3 days normal, 7 days C-section)",
      "Free transport from home to facility, inter-facility transfer, and drop back home"
    ],
    benefitsHi: [
      "पूरी तरह से मुफ्त प्रसव, जिसमें सामान्य प्रसव और सिजेरियन ऑपरेशन दोनों शामिल हैं",
      "अस्पताल में भर्ती के दौरान सभी आवश्यक दवाएं, उपभोग्य वस्तुएं और ग्लूकोज मुफ्त",
      "रक्त, मूत्र और अल्ट्रासाउंड सहित सभी लैब परीक्षण पूरी तरह निःशुल्क",
      "जरूरत पड़ने पर पूरी तरह से मुफ्त रक्त उपलब्धता और ट्रांसफ्यूजन",
      "अस्पताल में रहने के दौरान माता को मुफ्त पौष्टिक भोजन (सामान्य प्रसव में 3 दिन, सी-सेक्शन में 7 दिन)",
      "घर से अस्पताल लाने, रेफरल होने पर दूसरे केंद्र ले जाने और घर वापस छोड़ने के लिए मुफ्त एम्बुलेंस"
    ],
    eligibilityEn: "All pregnant women accessing public health institutions for delivery and all sick newborns/infants up to 1 year.",
    eligibilityHi: "प्रसव हेतु सरकारी स्वास्थ्य संस्थानों में आने वाली सभी गर्भवती महिलाएं एवं 1 वर्ष तक के सभी बीमार नवजात शिशु।",
    contactPhone: "104 / 108",
    contactWeb: "nhm.gov.in",
    applicationModeEn: "Automatic entitlement at any Government Hospital, Sub-District Hospital, CHC or PHC upon arrival",
    applicationModeHi: "किसी भी सरकारी अस्पताल, सीएचसी या पीएचसी में प्रसव या इलाज के लिए पहुंचने पर स्वतः लागू",
    themeColor: {
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800 border-teal-200",
      border: "border-teal-300",
      cardBg: "bg-teal-50/15",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700"
    },
    badgeTagEn: "100% Free Delivery",
    badgeTagHi: "शून्य खर्च प्रसव"
  },
  {
    id: "pradhan-mantri-matru-vandana",
    titleEn: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    titleHi: "प्रधानमंत्री मातृ वंदना योजना (PMMVY)",
    scope: "national",
    departmentEn: "Ministry of Women and Child Development (MoWCD)",
    departmentHi: "महिला एवं बाल विकास मंत्रालय, भारत सरकार",
    targetBeneficiariesEn: "Pregnant Women & Lactating Mothers (PW&LM) for 1st & 2nd child",
    targetBeneficiariesHi: "गर्भवती महिलाएं एवं स्तनपान कराने वाली माताएं (पहले व दूसरे बच्चे हेतु)",
    categories: ["females"],
    coverageAmount: "₹5,000 for 1st child / ₹6,000 for 2nd girl child",
    descriptionEn: "Centrally sponsored conditional cash transfer scheme providing wage compensation and maternal nutrition support directly into pregnant women's bank accounts to promote health-seeking behaviour.",
    descriptionHi: "गर्भवती महिलाओं के बैंक खातों में प्रत्यक्ष नकद हस्तांतरण द्वारा मजदूरी की भरपाई और पोषण सहायता प्रदान करने वाली केंद्र प्रायोजित योजना।",
    benefitsEn: [
      "₹5,000 in two installments for the first child upon ANC registration and institutional birth",
      "Special incentive of ₹6,000 in a single installment upon the birth of a second girl child",
      "Promotes exclusive breastfeeding and child immunization milestones",
      "Direct Benefit Transfer (DBT) directly into Aadhaar-linked bank accounts",
      "Helps improve health and nutritional status of mothers during pregnancy and lactation"
    ],
    benefitsHi: [
      "पहले बच्चे के लिए एएनसी पंजीकरण और संस्थागत जन्म पर दो किस्तों में ₹5,000 की सहायता",
      "दूसरे बच्चे के रूप में कन्या जन्म होने पर एकमुश्त ₹6,000 की विशेष नकद प्रोत्साहन राशि",
      "शिशु के पूर्ण टीकाकरण और 6 महीने तक केवल स्तनपान के लक्ष्यों को बढ़ावा",
      "सीधे आधार से जुड़े बैंक खाते में डायरेक्ट बेनिफिट ट्रांसफर (DBT)",
      "गर्भावस्था और स्तनपान के दौरान माताओं के पोषण स्तर में प्रत्यक्ष सुधार"
    ],
    eligibilityEn: "All Pregnant Women and Lactating Mothers (except regular govt employees).",
    eligibilityHi: "सभी गर्भवती और स्तनपान कराने वाली माताएं (नियमित सरकारी कर्मचारियों को छोड़कर)।",
    contactPhone: "011-23382393 / 104",
    contactWeb: "pmmvy.wcd.gov.in",
    applicationModeEn: "Apply online at pmmvy.wcd.gov.in or register through local Anganwadi Centre / ASHA",
    applicationModeHi: "pmmvy.wcd.gov.in पर ऑनलाइन या स्थानीय आंगनवाड़ी केंद्र / आशा कार्यकर्ता के जरिए पंजीकरण",
    themeColor: {
      badgeBg: "bg-fuchsia-50",
      badgeText: "text-fuchsia-800 border-fuchsia-200",
      border: "border-fuchsia-300",
      cardBg: "bg-fuchsia-50/15",
      iconBg: "bg-fuchsia-100",
      iconColor: "text-fuchsia-700"
    },
    badgeTagEn: "Maternity DBT",
    badgeTagHi: "मातृत्व नकद लाभ"
  },
  {
    id: "rashtriya-bal-swasthya",
    titleEn: "Rashtriya Bal Swasthya Karyakram (RBSK)",
    titleHi: "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम (RBSK)",
    scope: "national",
    departmentEn: "National Health Mission (NHM), MoHFW",
    departmentHi: "राष्ट्रीय स्वास्थ्य मिशन (NHM), स्वास्थ्य मंत्रालय",
    targetBeneficiariesEn: "All children from birth to 18 years of age (approx. 27 Crore children)",
    targetBeneficiariesHi: "जन्म से 18 वर्ष तक के सभी बच्चे (लगभग 27 करोड़ बच्चे)",
    categories: ["kids", "disability"],
    coverageAmount: "100% Free Screening & Tertiary Surgeries",
    descriptionEn: "Early child health screening and intervention initiative aimed at screening all children (0-18 yrs) for the '4 Ds': Defects at birth, Deficiencies, Diseases, and Developmental delays including disabilities.",
    descriptionHi: "0 से 18 वर्ष के बच्चों में 4D (जन्मजात विकार, पोषण कमियां, बीमारियां, और विकासात्मक देरी/दिव्यांगता) की शीघ्र पहचान और मुफ्त उपचार प्रदान करने वाली राष्ट्रीय स्वास्थ्य पहल।",
    benefitsEn: [
      "Screening for 32 designated health conditions across schools, anganwadis, and delivery points",
      "Free surgical repair for congenital heart defects, cleft lip/palate, clubfoot, and congenital cataract",
      "Free tertiary management and early intervention at District Early Intervention Centres (DEIC)",
      "Free management of severe acute malnutrition (SAM), goiter, and neural tube defects",
      "Specialized development therapy, speech therapy, and sensory integration for disabled children"
    ],
    benefitsHi: [
      "स्कूलों, आंगनवाड़ियों और प्रसव केंद्रों पर 32 निर्दिष्ट स्वास्थ्य स्थितियों की मुफ्त जांच",
      "जन्मजात हृदय रोग, कटे होंठ/तालू, क्लबफुट (मुड़े पैर) और जन्मजात मोतियाबिंद की मुफ्त सर्जरी",
      "जिला प्रारंभिक हस्तक्षेप केंद्रों (DEIC) पर तृतीयक स्तर का मुफ्त उपचार और प्रारंभिक सहायता",
      "गंभीर कुपोषण (SAM), घेंघा और न्यूरल ट्यूब विकारों का संपूर्ण मुफ्त उपचार",
      "दिव्यांग बच्चों के लिए विशेष थेरेपी, स्पीच थेरेपी और सेंसरी थेरेपी सहायता"
    ],
    eligibilityEn: "All newborns and children up to 18 years enrolled in Anganwadi centres and Government/Govt-aided schools.",
    eligibilityHi: "आंगनवाड़ियों और सरकारी या सहायता प्राप्त स्कूलों में नामांकित जन्म से 18 वर्ष तक के सभी बच्चे।",
    contactPhone: "104 (Health Helpline)",
    contactWeb: "nhm.gov.in",
    applicationModeEn: "Dedicated RBSK Mobile Health Teams screen schools and Anganwadis; referrals treated at DEIC / GMCs",
    applicationModeHi: "RBSK मोबाइल स्वास्थ्य टीमों द्वारा स्कूलों/आंगनवाड़ियों में जांच; जिला DEIC केंद्रों में मुफ्त उपचार",
    themeColor: {
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-800 border-amber-200",
      border: "border-amber-300",
      cardBg: "bg-amber-50/15",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700"
    },
    badgeTagEn: "Child Health 0-18",
    badgeTagHi: "शिशु स्वास्थ्य 0-18"
  },
  {
    id: "nikshay-poshan-yojana",
    titleEn: "Ni-kshay Poshan Yojana (TB Nutritional Support)",
    titleHi: "निक्षय पोषण योजना (टीबी पोषण सहायता)",
    scope: "national",
    departmentEn: "Central TB Division, MoHFW (NTEP)",
    departmentHi: "केंद्रीय टीबी प्रभाग, स्वास्थ्य मंत्रालय (NTEP)",
    targetBeneficiariesEn: "All notified Tuberculosis (TB) patients across India",
    targetBeneficiariesHi: "भारत भर में सभी अधिसूचित तपेदिक (टीबी) रोगी",
    categories: ["tb", "poverty_upliftment"],
    coverageAmount: "₹500 / month direct cash transfer + Free treatment",
    descriptionEn: "Direct Benefit Transfer (DBT) scheme providing ₹500 per month for nutritional support to all notified TB patients throughout their treatment course, alongside 100% free anti-TB drugs and molecular diagnostic testing.",
    descriptionHi: "सभी अधिसूचित टीबी रोगियों को उनके उपचार के दौरान पोषण सहायता के लिए प्रति माह ₹500 का प्रत्यक्ष नकद हस्तांतरण (DBT), साथ ही 100% मुफ्त दवाएं और उच्च तकनीक सीबीनाट जांच।",
    benefitsEn: [
      "Direct Benefit Transfer of ₹500 per month credited directly to patient's bank account",
      "Disbursed every month throughout the entire duration of active anti-TB treatment (6 to 24 months)",
      "100% free high-sensitivity molecular diagnostics (CBNAAT / TrueNat) at public labs",
      "Free daily fixed-dose combination anti-TB medication delivered to doorstep/DOTS centre",
      "Additional monthly nutrition food baskets supported by Ni-kshay Mitra community volunteers"
    ],
    benefitsHi: [
      "रोगी के बैंक खाते में सीधे प्रति माह ₹500 का प्रत्यक्ष नकद हस्तांतरण (DBT)",
      "उपचार की पूरी अवधि (6 से 24 महीने) तक प्रत्येक माह नियमित भुगतान",
      "सरकारी स्वास्थ्य केंद्रों पर 100% मुफ्त उच्च-सटीक सीबीनाट/ट्रूनाट जांच",
      "दैनिक रूप से ली जाने वाली उच्च गुणवत्ता वाली टीबी दवाएं पूरी तरह मुफ्त उपलब्ध",
      "निक्षय मित्र समुदाय पहल के तहत अतिरिक्त पौष्टिक खाद्य बास्केट का वितरण"
    ],
    eligibilityEn: "All TB patients notified on the national Ni-kshay portal (both public and private sectors).",
    eligibilityHi: "राष्ट्रीय निक्षय पोर्टल पर अधिसूचित सभी टीबी मरीज (चाहे सरकारी में इलाज करा रहे हों या निजी में)।",
    contactPhone: "1800-11-6666 (TB Toll Free Helpline)",
    contactWeb: "nikshay.in",
    applicationModeEn: "Automatic notification on Ni-kshay portal by diagnosing health clinic/hospital",
    applicationModeHi: "निदान करने वाले अस्पताल/डॉक्टर द्वारा निक्षय पोर्टल पर मरीज का पंजीकरण कर बैंक विवरण दर्ज करना",
    themeColor: {
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-800 border-orange-200",
      border: "border-orange-300",
      cardBg: "bg-orange-50/15",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-700"
    },
    badgeTagEn: "TB Elimination",
    badgeTagHi: "टीबी उन्मूलन"
  },
  {
    id: "tele-manas",
    titleEn: "Tele-MANAS (24/7 Mental Health Helpline)",
    titleHi: "टेली-मानस (24/7 राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन)",
    scope: "national",
    departmentEn: "NIMHANS Bengaluru & MoHFW",
    departmentHi: "निमहांस बेंगलुरु एवं स्वास्थ्य मंत्रालय, भारत सरकार",
    targetBeneficiariesEn: "Anyone experiencing mental distress, anxiety, depression, or suicidal thoughts",
    targetBeneficiariesHi: "तनाव, चिंता, अवसाद या संकट का सामना कर रहा कोई भी व्यक्ति",
    categories: ["mental_health"],
    coverageAmount: "100% Free 24/7 Counseling & Psychiatric Referral",
    descriptionEn: "A 24x7 toll-free tele-mental health helpline network functioning across 36 States/UTs in 20+ regional Indian languages, connecting distress callers with certified mental health counselors and clinical psychiatrists.",
    descriptionHi: "36 राज्यों और केंद्र शासित प्रदेशों में 20+ क्षेत्रीय भाषाओं में 24 घंटे उपलब्ध निःशुल्क टेली-मानसिक स्वास्थ्य हेल्पलाइन, जो संकटग्रस्त कॉलर्स को प्रमाणित काउंसलर और मनोचिकित्सकों से जोड़ती है।",
    benefitsEn: [
      "Toll-free 24/7 round-the-clock access via short code 14416 or 1800-891-4416",
      "Multilingual counseling available in Hindi, English, and 20+ regional Indian languages",
      "Tier 1: Immediate crisis intervention, psychological first aid, and empathetic listening",
      "Tier 2: Direct escalation to clinical psychiatrists and clinical psychologists for medication",
      "Physical link to District Mental Health Programme (DMHP) units for in-person care",
      "Complete caller anonymity and data privacy maintained"
    ],
    benefitsHi: [
      "शॉर्ट कोड 14416 या 1800-891-4416 के माध्यम से 24 घंटे मुफ्त फोन परामर्श",
      "हिंदी, अंग्रेजी और 20+ भारतीय क्षेत्रीय भाषाओं में परामर्श सेवा उपलब्ध",
      "स्तर 1: संकट के समय तत्काल परामर्श, मानसिक प्राथमिक चिकित्सा और संवेदी मार्गदर्शन",
      "स्तर 2: गंभीर मामलों में वरिष्ठ मनोचिकित्सकों और नैदानिक मनोवैज्ञानिकों से सीधी बात",
      "आवश्यकता पड़ने पर जिला अस्पताल के मानसिक स्वास्थ्य क्लिनिक (DMHP) से प्रत्यक्ष जुड़ाव",
      "कॉल करने वाले की पहचान और गोपनीयता पूरी तरह सुरक्षित"
    ],
    eligibilityEn: "Open to any citizen in India needing mental health support, emotional counseling, or de-addiction guidance.",
    eligibilityHi: "भारत के किसी भी नागरिक के लिए खुला है जिसे मानसिक स्वास्थ्य सहायता या परामर्श की आवश्यकता है।",
    contactPhone: "14416 / 1800-891-4416",
    contactWeb: "telemanas.mohfw.gov.in",
    applicationModeEn: "Direct 1-tap phone call from any mobile or landline across India (Dial 14416)",
    applicationModeHi: "देश के किसी भी फोन से सीधा 14416 डायल करें (कॉल पूरी तरह मुफ्त है)",
    themeColor: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800 border-emerald-200",
      border: "border-emerald-300",
      cardBg: "bg-emerald-50/15",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700"
    },
    badgeTagEn: "24/7 Mental Health",
    badgeTagHi: "24/7 मानसिक परामर्श"
  },
  {
    id: "janaushadhi-pariyojana",
    titleEn: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)",
    titleHi: "प्रधानमंत्री भारतीय जनऔषधि परियोजना (PMBJP)",
    scope: "national",
    departmentEn: "Pharmaceuticals & Medical Devices Bureau of India (PMBI)",
    departmentHi: "भारतीय फार्मास्युटिकल्स एवं मेडिकल डिवाइसेस ब्यूरो (PMBI)",
    targetBeneficiariesEn: "All Indian citizens seeking affordable quality medicines",
    targetBeneficiariesHi: "सस्ती गुणवत्तापूर्ण दवाएं चाहने वाले सभी भारतीय नागरिक",
    categories: ["poverty_upliftment"],
    coverageAmount: "50% to 90% Savings on All Medicines",
    descriptionEn: "Government initiative to make high-quality generic medicines, surgical items, and sanitary pads accessible to everyone at prices 50% to 90% lower than branded market alternatives through 10,000+ Janaushadhi Kendras.",
    descriptionHi: "10,000+ जनऔषधि केंद्रों के माध्यम से ब्रांडेड बाजार दरों की तुलना में 50% से 90% कम कीमत पर उच्च गुणवत्ता वाली जेनेरिक दवाएं और सर्जिकल सामान उपलब्ध कराने की सरकारी पहल।",
    benefitsEn: [
      "Over 1,965 high-quality medicines and 293 surgical consumables available",
      "Substantial cost savings of 50% to 90% compared to branded pharmaceutical equivalents",
      "Covers all chronic disease categories: diabetes, cardiac, oncology, gastro, neurology",
      "Suvidha Oxo-biodegradable sanitary napkins available at just ₹1 per pad",
      "Every batch tested at NABL-accredited laboratories ensuring WHO-GMP quality standards"
    ],
    benefitsHi: [
      "1,965 से अधिक उच्च गुणवत्ता वाली दवाएं और 293 सर्जिकल उत्पाद उपलब्ध",
      "ब्रांडेड बाजार दवाओं की तुलना में 50% से 90% की सीधी भारी बचत",
      "मधुमेह, हृदय रोग, कैंसर, न्यूरो और बीपी जैसी सभी दीर्घकालिक बीमारियों की दवाएं उपलब्ध",
      "सुविधा ऑक्सो-बायोडिग्रेडेबल सैनिटरी पैड मात्र ₹1 प्रति पैड की दर पर उपलब्ध",
      "डब्ल्यूएचओ-जीएमपी मानकों को सुनिश्चित करने के लिए एनएबीएल मान्यता प्राप्त लैब में जांच"
    ],
    eligibilityEn: "Universal access for all citizens with a valid doctor's prescription.",
    eligibilityHi: "वैध डॉक्टर के पर्चे के साथ सभी नागरिकों के लिए सार्वभौमिक रूप से उपलब्ध।",
    contactPhone: "1800-180-8080",
    contactWeb: "janaushadhi.gov.in",
    applicationModeEn: "Direct purchase at any of the 10,000+ Pradhan Mantri Bhartiya Janaushadhi Kendras nationwide",
    applicationModeHi: "देशभर के 10,000+ प्रधानमंत्री भारतीय जनऔषधि केंद्रों में से किसी पर भी सीधे जाकर दवाएं खरीदें",
    themeColor: {
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800 border-blue-200",
      border: "border-blue-300",
      cardBg: "bg-blue-50/15",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700"
    },
    badgeTagEn: "Affordable Generic Medicines",
    badgeTagHi: "सस्ती जेनेरिक दवाएं"
  },
  {
    id: "adip-disability-scheme",
    titleEn: "ADIP Scheme (Assistive Aids & Prosthetics for Paralysis & Disabled)",
    titleHi: "एडिप योजना (दिव्यांगों एवं लकवाग्रस्त मरीजों हेतु सहायक उपकरण)",
    scope: "national",
    departmentEn: "ALIMCO & Ministry of Social Justice and Empowerment",
    departmentHi: "एलिम्को एवं सामाजिक न्याय व अधिकारिता मंत्रालय",
    targetBeneficiariesEn: "Persons with physical disabilities, paralysis, limb loss, or hearing/visual loss",
    targetBeneficiariesHi: "शारीरिक दिव्यांगता, पक्षाघात, कटे अंग या श्रवण/दृष्टि दोष वाले व्यक्ति",
    categories: ["disability", "elderly"],
    coverageAmount: "100% Free Aids & Prosthetics (Up to ₹15,000 to ₹6 Lakh for Implants)",
    descriptionEn: "Central scheme providing free sophisticated, durable aids and assistive appliances (motorized tricycles, wheelchairs, prosthetic limbs, cochlear implants) to improve independent mobility and rehabilitation.",
    descriptionHi: "दिव्यांगजनों और लकवाग्रस्त व्यक्तियों की गतिशीलता बढ़ाने के लिए मुफ्त मोटर चालित तिपहिया साइकिल, व्हीलचेयर, कृत्रिम अंग और कॉकलियर इम्प्लांट प्रदान करने वाली केंद्रीय योजना।",
    benefitsEn: [
      "Free motorized tricycles and battery-operated wheelchairs for severe locomotor/paralysis cases",
      "Free custom-fit modern modular artificial limbs (prosthetics) and callipers",
      "Free pediatric cochlear implants (worth up to ₹6,00,000) for hearing-impaired children up to 5 yrs",
      "Free smart canes, Braille kits, talking phones, and daisy players for visually impaired",
      "Periodic mega-distribution camps conducted by ALIMCO in districts nationwide"
    ],
    benefitsHi: [
      "गंभीर लकवा और गतिशीलता दिव्यांगता के मामलों में मुफ्त मोटर चालित ट्राइसाइकिल और व्हीलचेयर",
      "कटे अंगों के लिए आधुनिक मॉड्यूलर कृत्रिम अंग (प्रोस्थेटिक्स) और कैलीपर्स मुफ्त",
      "5 वर्ष तक के बच्चों के लिए ₹6,00,000 मूल्य का कॉकलियर इम्प्लांट ऑपरेशन पूरी तरह मुफ्त",
      "दृष्टिबाधितों के लिए स्मार्ट केन, ब्रेल किट और टॉकिंग फोन मुफ्त",
      "एलिम्को द्वारा देशभर के जिलों में आयोजित विशेष वितरण शिविरों में मुफ्त वितरण"
    ],
    eligibilityEn: "Indian citizens with 40%+ certified disability and monthly family income up to ₹22,500 (100% free aids) or ₹22,501 to ₹30,000 (50% subsidy).",
    eligibilityHi: "40% या अधिक प्रमाणित दिव्यांगता वाले भारतीय नागरिक जिनकी मासिक पारिवारिक आय ₹22,500 तक हो (100% मुफ्त उपकरण)।",
    contactPhone: "1800-180-5129 (ALIMCO Toll Free)",
    contactWeb: "alimco.in",
    applicationModeEn: "Apply through District Disability Rehabilitation Centres (DDRC) or ALIMCO assessment camps",
    applicationModeHi: "जिला दिव्यांग पुनर्वास केंद्र (DDRC), समाज कल्याण विभाग या एलिम्को शिविरों में आवेदन करें",
    themeColor: {
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-800 border-sky-200",
      border: "border-sky-300",
      cardBg: "bg-sky-50/15",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700"
    },
    badgeTagEn: "Free Assistive Devices",
    badgeTagHi: "मुफ्त सहायक उपकरण"
  },

  // ==========================================
  // STATE GOVERNMENT HEALTH SCHEMES
  // ==========================================
  {
    id: "mp-bal-hridaya",
    titleEn: "Mukhyamantri Bal Hridaya Upchar Yojana",
    titleHi: "मुख्यमंत्री बाल हृदय उपचार योजना",
    scope: "state",
    stateCode: "23",
    stateNameEn: "Madhya Pradesh",
    stateNameHi: "मध्य प्रदेश",
    departmentEn: "Public Health and Family Welfare Dept., Govt. of Madhya Pradesh",
    departmentHi: "लोक स्वास्थ्य एवं परिवार कल्याण विभाग, मध्य प्रदेश सरकार",
    targetBeneficiariesEn: "Children (0-18 yrs) suffering from congenital heart disease in MP",
    targetBeneficiariesHi: "मध्य प्रदेश के जन्मजात हृदय रोग से पीड़ित बच्चे (0 से 18 वर्ष)",
    categories: ["kids"],
    coverageAmount: "100% Free Heart Surgery (Up to ₹2,00,000+)",
    descriptionEn: "Madhya Pradesh state government scheme providing complete financial funding and free corrective cardiac surgeries for eligible children suffering from congenital heart diseases (VSD, ASD, TOF, valve defects).",
    descriptionHi: "मध्य प्रदेश सरकार की योजना जो जन्मजात हृदय रोगों (दिल में छेद, वाल्व खराबी) से पीड़ित बच्चों के लिए सूचीबद्ध सुपर स्पेशियलिटी अस्पतालों में मुफ्त हृदय शल्य चिकित्सा प्रदान करती है।",
    benefitsEn: [
      "100% free cardiac surgery in premier empanelled super-specialty hospitals (AIIMS Bhopal, BMHRC, Fortis, Narayana)",
      "Financial assistance up to ₹2,00,000 per child (or full package cost of surgery)",
      "Covers pre-operative cardiac workup, echocardiograms, catheterization, and post-op ICU care",
      "Free follow-up medications and pediatric cardiology consultations",
      "Dedicated state committee ensures swift approvals within 7 days"
    ],
    benefitsHi: [
      "एम्स भोपाल, बीएमएचआरसी और नारायण हृदयालय जैसे शीर्ष अस्पतालों में 100% मुफ्त हृदय सर्जरी",
      "प्रति बच्चे ₹2,00,000 तक या सर्जरी पैकेज की पूरी लागत की वित्तीय सहायता",
      "ऑपरेशन से पहले की ईको जांच, एंजियोग्राफी, दवाएं और आईसीयू देखभाल पूरी तरह मुफ्त",
      "ऑपरेशन के बाद आवश्यक दवाएं और बाल हृदय रोग विशेषज्ञ की फॉलो-अप जांच",
      "7 दिनों के भीतर त्वरित प्रशासनिक स्वीकृति के लिए विशेष जिला समिति"
    ],
    eligibilityEn: "Permanent residents of Madhya Pradesh aged 0 to 18 years diagnosed with congenital heart disease.",
    eligibilityHi: "मध्य प्रदेश के मूल निवासी बच्चे (आयु 0 से 18 वर्ष) जिन्हें जन्मजात हृदय रोग का निदान हुआ हो।",
    contactPhone: "181 (MP CM Helpline)",
    contactWeb: "health.mp.gov.in",
    applicationModeEn: "Apply through Chief Medical & Health Officer (CMHO) or Civil Surgeon of District Hospital in MP",
    applicationModeHi: "मध्य प्रदेश के संबंधित जिले के मुख्य चिकित्सा एवं स्वास्थ्य अधिकारी (CMHO) कार्यालय में आवेदन करें",
    themeColor: {
      badgeBg: "bg-red-50",
      badgeText: "text-red-800 border-red-200",
      border: "border-red-300",
      cardBg: "bg-red-50/15",
      iconBg: "bg-red-100",
      iconColor: "text-red-700"
    },
    badgeTagEn: "MP State Special",
    badgeTagHi: "मध्य प्रदेश विशेष"
  },
  {
    id: "mp-deendayal-antyodaya",
    titleEn: "Deendayal Antyodaya Upchar Yojana",
    titleHi: "दीनदयाल अंत्योदय उपचार योजना",
    scope: "state",
    stateCode: "23",
    stateNameEn: "Madhya Pradesh",
    stateNameHi: "मध्य प्रदेश",
    departmentEn: "Govt. of Madhya Pradesh Health Department",
    departmentHi: "मध्य प्रदेश सरकार स्वास्थ्य विभाग",
    targetBeneficiariesEn: "BPL, SC, and ST families residing in Madhya Pradesh",
    targetBeneficiariesHi: "मध्य प्रदेश के बीपीएल, अनुसूचित जाति एवं जनजाति के परिवार",
    categories: ["poverty_upliftment"],
    coverageAmount: "Up to ₹20,000 / family / year",
    descriptionEn: "Madhya Pradesh welfare scheme providing health security and cashless hospitalization, diagnostic tests, and medicines up to ₹20,000 per family per year in all public healthcare institutions across the state.",
    descriptionHi: "मध्य प्रदेश के सबसे गरीब परिवारों को राज्य के सभी सरकारी अस्पतालों में ₹20,000 प्रति वर्ष तक मुफ्त चिकित्सा जांच, अस्पताल में भर्ती और उपचार प्रदान करने वाली योजना।",
    benefitsEn: [
      "Free medical investigation and treatment up to ₹20,000 per family per year",
      "Available for BPL cardholders and members of SC/ST communities across MP",
      "Cashless access at all Government District Hospitals, Civil Hospitals, and CHCs in MP",
      "Covers routine medical admissions, minor surgeries, radiology, and pharmacy bills"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹20,000 तक की मुफ्त चिकित्सा जांच और उपचार सुविधा",
      "मध्य प्रदेश के सभी बीपीएल कार्डधारकों और एससी/एसटी परिवारों के लिए उपलब्ध",
      "राज्य के सभी जिला अस्पतालों, सिविल अस्पतालों और सामुदायिक स्वास्थ्य केंद्रों में मान्य",
      "दवाओं, पैथोलॉजी जांच, एक्स-रे और इनडोर भर्ती के खर्च पूरी तरह कवर"
    ],
    eligibilityEn: "BPL cardholders and members of Scheduled Castes and Scheduled Tribes resident in Madhya Pradesh.",
    eligibilityHi: "मध्य प्रदेश के बीपीएल राशन कार्डधारक और अनुसूचित जाति / अनुसूचित जनजाति वर्ग के परिवार।",
    contactPhone: "181 (CM Helpline MP)",
    contactWeb: "health.mp.gov.in",
    applicationModeEn: "Direct presentation of BPL card or Deendayal Upchar Card at District Hospital Registration Counter",
    applicationModeHi: "जिला अस्पताल या सीएचसी काउंटर पर बीपीएल कार्ड या दीनदयाल कार्ड प्रस्तुत करें",
    themeColor: {
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-800 border-purple-200",
      border: "border-purple-300",
      cardBg: "bg-purple-50/15",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700"
    },
    badgeTagEn: "MP BPL Relief",
    badgeTagHi: "मध्य प्रदेश बीपीएल राहत"
  },
  {
    id: "mh-mjpjay",
    titleEn: "Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)",
    titleHi: "महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY)",
    scope: "state",
    stateCode: "27",
    stateNameEn: "Maharashtra",
    stateNameHi: "महाराष्ट्र",
    departmentEn: "State Health Assurance Society, Govt. of Maharashtra",
    departmentHi: "राज्य स्वास्थ्य गारंटी सोसाइटी, महाराष्ट्र सरकार",
    targetBeneficiariesEn: "All Ration Card holders (Yellow, Orange, White) across Maharashtra",
    targetBeneficiariesHi: "महाराष्ट्र के सभी राशन कार्ड धारक (पीला, केसरी, और सफेद कार्ड)",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Maharashtra's universalized health assurance scheme covering all 12.5 crore citizens with ₹5 Lakh cashless hospitalization cover across 996 specialized surgical and medical procedures in 1,000+ empanelled hospitals.",
    descriptionHi: "महाराष्ट्र की सार्वभौमिक स्वास्थ्य योजना जो राज्य के सभी राशन कार्ड धारक परिवारों को 1,000+ सूचीबद्ध अस्पतालों में 996 विशेष प्रक्रियाओं के लिए ₹5 लाख का कैशलेस स्वास्थ्य कवर देती है।",
    benefitsEn: [
      "Cashless health insurance coverage of ₹5,00,000 per family per year",
      "Covers 996 medical/surgical procedures across 34 identified specialized categories",
      "Includes high-cost cardiac surgeries, oncology chemotherapy/radiation, neurosurgery, and burns",
      "Free kidney transplant coverage (up to ₹2.5 Lakh per surgery) and maintenance dialysis",
      "Aarogyamitra helpdesks stationed at every network hospital for hassle-free admission"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 का व्यापक कैशलेस स्वास्थ्य बीमा कवर",
      "34 विशेष श्रेणियों में 996 मेडिकल और सर्जिकल उपचार प्रक्रियाएं शामिल",
      "जटिल हृदय सर्जरी, कैंसर कीमोथेरेपी/रेडिएशन, न्यूरोसर्जरी और बर्न केयर शामिल",
      "किडनी प्रत्यारोपण (₹2.5 लाख तक) और नियमित डायलिसिस की सुविधा",
      "अस्पताल में सहायता के लिए प्रत्येक नेटवर्क अस्पताल में आरोग्यमित्र सहायता केंद्र"
    ],
    eligibilityEn: "All families holding valid Yellow, Orange, or White Ration Cards issued by the Food and Civil Supplies Dept. of Maharashtra.",
    eligibilityHi: "महाराष्ट्र सरकार द्वारा जारी वैध पीला, केसरी (नारंगी) या सफेद राशन कार्ड धारक सभी परिवार।",
    contactPhone: "1800-120-8040 / 155388",
    contactWeb: "jeevandayee.gov.in",
    applicationModeEn: "Direct walk-in with Ration Card and Aadhaar at any empanelled hospital MJPJAY Kiosk",
    applicationModeHi: "किसी भी सूचीबद्ध अस्पताल में स्थित एमजेपीजेएवाई कियोस्क पर राशन कार्ड व आधार कार्ड दिखाकर भर्ती",
    themeColor: {
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800 border-blue-200",
      border: "border-blue-300",
      cardBg: "bg-blue-50/15",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700"
    },
    badgeTagEn: "Maharashtra Universal",
    badgeTagHi: "महाराष्ट्र सार्वभौमिक"
  },
  {
    id: "delhi-farishte",
    titleEn: "Farishte Dilli Ke Scheme (100% Free Emergency Trauma Care)",
    titleHi: "फरिश्ते दिल्ली के योजना (100% मुफ्त आपातकालीन ट्रॉमा इलाज)",
    scope: "state",
    stateCode: "07",
    stateNameEn: "Delhi",
    stateNameHi: "दिल्ली",
    departmentEn: "Govt. of NCT of Delhi Health Department",
    departmentHi: "स्वास्थ्य विभाग, राष्ट्रीय राजधानी क्षेत्र दिल्ली सरकार",
    targetBeneficiariesEn: "Any victim of road accidents, burn injuries, or acid attacks in Delhi",
    targetBeneficiariesHi: "दिल्ली में सड़क दुर्घटना, आगजनी या एसिड अटैक का शिकार कोई भी व्यक्ति",
    categories: ["emergency_trauma"],
    coverageAmount: "100% Free (No Cap on Life-Saving ICU / Surgery)",
    descriptionEn: "Delhi's pioneering emergency initiative providing 100% free, cashless trauma care at any private or government hospital in Delhi during the critical 'Golden Hour', alongside legal protection and financial rewards for Good Samaritans.",
    descriptionHi: "सड़क दुर्घटना, आग या एसिड हमले के पीड़ितों को दिल्ली के किसी भी निजी या सरकारी अस्पताल में 'गोल्डन ऑवर' के दौरान 100% मुफ्त और कैशलेस आपातकालीन ट्रॉमा व आईसीयू इलाज देने वाली योजना।",
    benefitsEn: [
      "100% cashless emergency surgery and ICU treatment at any private hospital in Delhi",
      "No income barrier, domicile restriction, or nationality check for the victim",
      "Entire medical and surgical bills settled directly by the Delhi Government",
      "Good Samaritan protection: helpers will not be detained, questioned by police, or summoned to court",
      "Cash incentive of ₹2,000 and appreciation certificate given to citizens who bring victims to hospital"
    ],
    benefitsHi: [
      "दिल्ली के किसी भी बड़े निजी अस्पताल में 100% कैशलेस इमरजेंसी सर्जरी और आईसीयू इलाज",
      "पीड़ित के लिए कोई आय प्रमाण पत्र, दिल्ली निवास या राष्ट्रीयता की बाध्यता नहीं",
      "अस्पताल का संपूर्ण मेडिकल बिल सीधे दिल्ली सरकार द्वारा चुकाया जाता है",
      "मददगारों की सुरक्षा: पीड़ित को अस्पताल पहुंचाने वाले को पुलिस या अदालत द्वारा परेशान नहीं किया जाएगा",
      "घायल को तुरंत अस्पताल पहुंचाने वाले भले नागरिकों को ₹2,000 की प्रोत्साहन राशि व प्रमाण पत्र"
    ],
    eligibilityEn: "Anyone who meets with a road traffic accident, burn injury, or acid attack within the NCT of Delhi.",
    eligibilityHi: "दिल्ली एनसीटी की सीमा के भीतर सड़क दुर्घटना, जलने या एसिड अटैक का शिकार हुआ कोई भी व्यक्ति।",
    contactPhone: "102 / 112 / 1031",
    contactWeb: "delhi.gov.in",
    applicationModeEn: "Immediate admission into the emergency trauma ward of nearest private or public hospital",
    applicationModeHi: "निकटतम निजी या सरकारी अस्पताल के इमरजेंसी वार्ड में तत्काल प्रवेश (कोई अग्रिम राशि नहीं)",
    themeColor: {
      badgeBg: "bg-red-50",
      badgeText: "text-red-800 border-red-200",
      border: "border-red-300",
      cardBg: "bg-red-50/15",
      iconBg: "bg-red-100",
      iconColor: "text-red-700"
    },
    badgeTagEn: "Golden Hour Lifesaver",
    badgeTagHi: "गोल्डन ऑवर रक्षक"
  },
  {
    id: "tn-cmchis",
    titleEn: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
    titleHi: "मुख्यमंत्री व्यापक स्वास्थ्य बीमा योजना (CMCHIS)",
    scope: "state",
    stateCode: "33",
    stateNameEn: "Tamil Nadu",
    stateNameHi: "तमिलनाडु",
    departmentEn: "Health & Family Welfare Dept., Govt. of Tamil Nadu",
    departmentHi: "स्वास्थ्य एवं परिवार कल्याण विभाग, तमिलनाडु सरकार",
    targetBeneficiariesEn: "Families residing in Tamil Nadu with annual income up to ₹1,20,000",
    targetBeneficiariesHi: "तमिलनाडु में रहने वाले परिवार जिनकी वार्षिक आय ₹1,20,000 तक है",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Tamil Nadu's benchmark cashless health insurance scheme covering 1,090 surgical procedures, 8 diagnostics, and 154 specialized follow-up procedures across 1,000+ government and private network hospitals.",
    descriptionHi: "तमिलनाडु की प्रमुख कैशलेस स्वास्थ्य बीमा योजना जो 1,000+ सरकारी व निजी अस्पतालों में 1,090 सर्जिकल प्रक्रियाओं और 154 फॉलो-अप उपचारों के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का कवर देती है।",
    benefitsEn: [
      "Cashless health insurance cover of up to ₹5,00,000 per family per year",
      "Covers 1,090 medical/surgical procedures including open heart surgery, organ transplants, and cancer care",
      "Special package for cochlear implants in children and specialized pediatric surgeries",
      "Empanelled network includes top medical college hospitals and premier private facilities in TN",
      "Integrated emergency ambulance access through 108"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 तक का व्यापक कैशलेस स्वास्थ्य बीमा कवर",
      "ओपन हार्ट सर्जरी, अंग प्रत्यारोपण और कैंसर सहित 1,090 सर्जिकल प्रक्रियाएं शामिल",
      "बच्चों में कॉकलियर इम्प्लांट और जटिल बाल चिकित्सा सर्जरी के लिए विशेष पैकेज",
      "तमिलनाडु के 1,000+ शीर्ष सरकारी मेडिकल कॉलेजों और प्रतिष्ठित निजी अस्पतालों में मान्य",
      "108 इमरजेंसी एम्बुलेंस सेवा के साथ एकीकृत समन्वय"
    ],
    eligibilityEn: "Resident families of Tamil Nadu whose annual income is less than ₹1,20,000 as per Village Administrative Officer (VAO) income certificate.",
    eligibilityHi: "तमिलनाडु के निवासी परिवार जिनकी वार्षिक आय ग्राम प्रशासनिक अधिकारी (VAO) प्रमाण पत्र के अनुसार ₹1,20,000 से कम है।",
    contactPhone: "1800-425-3993",
    contactWeb: "cmchistn.com",
    applicationModeEn: "Enroll with Smart Ration Card and Income Certificate at District Collectorate CMCHIS Kiosk",
    applicationModeHi: "स्मार्ट राशन कार्ड और आय प्रमाण पत्र के साथ जिला कलेक्ट्रेट सीएमसीएचआईएस केंद्र पर नामांकन",
    themeColor: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800 border-emerald-200",
      border: "border-emerald-300",
      cardBg: "bg-emerald-50/15",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700"
    },
    badgeTagEn: "Tamil Nadu Benchmark",
    badgeTagHi: "तमिलनाडु मॉडल"
  },
  {
    id: "ap-ysr-aarogyasri",
    titleEn: "Dr. YSR Aarogyasri Health Scheme",
    titleHi: "डॉ. वाईएसआर आरोग्यश्री स्वास्थ्य योजना",
    scope: "state",
    stateCode: "28",
    stateNameEn: "Andhra Pradesh",
    stateNameHi: "आंध्र प्रदेश",
    departmentEn: "Dr. YSR Aarogyasri Health Care Trust, Govt. of Andhra Pradesh",
    departmentHi: "डॉ. वाईएसआर आरोग्यश्री हेल्थ केयर ट्रस्ट, आंध्र प्रदेश सरकार",
    targetBeneficiariesEn: "Families in Andhra Pradesh with annual income up to ₹5,00,000",
    targetBeneficiariesHi: "आंध्र प्रदेश के परिवार जिनकी वार्षिक आय ₹5,00,000 तक है",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "₹25,00,000 / family / year",
    descriptionEn: "Andhra Pradesh's landmark health coverage offering an unprecedented ₹25 Lakh cashless coverage per family per year, spanning 3,257 secondary and tertiary care medical and surgical procedures.",
    descriptionHi: "आंध्र प्रदेश की ऐतिहासिक स्वास्थ्य योजना जो प्रति परिवार प्रति वर्ष रिकॉर्ड ₹25 लाख तक का कैशलेस इलाज 3,257 बीमारियों और सर्जिकल प्रक्रियाओं के लिए प्रदान करती है।",
    benefitsEn: [
      "Massive coverage limit of up to ₹25,00,000 per family per year",
      "Covers 3,257 medical, surgical, and cancer procedures across super-specialty hospitals",
      "Post-operative allowance (Aarogya Aasara) up to ₹5,000/month for wage loss during recovery",
      "Free medicines for chronic ailments delivered to doorstep for up to 30 days post-discharge",
      "Valid in network hospitals across AP, Hyderabad, Chennai, and Bengaluru"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹25,00,000 तक का भारी कैशलेस स्वास्थ्य कवर",
      "सुपर-स्पेशियलिटी अस्पतालों में 3,257 मेडिकल, सर्जिकल और कैंसर प्रक्रियाएं पूरी तरह कवर",
      "आरोग्य आसरा: ठीक होने के दौरान मजदूरी नुकसान की भरपाई हेतु ₹5,000 प्रति माह तक भत्ता",
      "अस्पताल से छुट्टी के बाद 30 दिनों तक की आवश्यक दवाएं मुफ्त उपलब्ध",
      "आंध्र प्रदेश के अलावा हैदराबाद, चेन्नई और बेंगलुरु के सूचीबद्ध शीर्ष अस्पतालों में भी मान्य"
    ],
    eligibilityEn: "Resident families of Andhra Pradesh holding Rice Cards (BPL) or having annual income up to ₹5,00,000.",
    eligibilityHi: "आंध्र प्रदेश के निवासी परिवार जिनके पास राइस कार्ड (बीपीएल) है या वार्षिक आय ₹5 लाख तक है।",
    contactPhone: "104 / 1800-599-1111",
    contactWeb: "aarogyasri.ap.gov.in",
    applicationModeEn: "Automatic linkage via Rice Card / Aarogyasri Card at any Network Hospital Help Desk",
    applicationModeHi: "राइस कार्ड या आरोग्यश्री कार्ड के साथ किसी भी नेटवर्क अस्पताल के हेल्पडेस्क पर तुरंत पंजीकरण",
    themeColor: {
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800 border-teal-200",
      border: "border-teal-300",
      cardBg: "bg-teal-50/15",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700"
    },
    badgeTagEn: "₹25 Lakh High Cover",
    badgeTagHi: "₹25 लाख रिकॉर्ड कवर"
  },
  {
    id: "ts-aarogyasri",
    titleEn: "Telangana Aarogyasri Scheme",
    titleHi: "तेलंगाना आरोग्यश्री योजना",
    scope: "state",
    stateCode: "36",
    stateNameEn: "Telangana",
    stateNameHi: "तेलंगाना",
    departmentEn: "Aarogyasri Health Care Trust, Govt. of Telangana",
    departmentHi: "आरोग्यश्री हेल्थ केयर ट्रस्ट, तेलंगाना सरकार",
    targetBeneficiariesEn: "BPL and low-income families across Telangana",
    targetBeneficiariesHi: "तेलंगाना के बीपीएल और निम्न आय वर्ग के परिवार",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "Up to ₹10,00,000 / family / year",
    descriptionEn: "Telangana government's premier cashless health scheme, recently expanded up to ₹10 Lakh per family per year covering 1,672 treatments, cochlear implants, organ transplants, and cancer therapies.",
    descriptionHi: "तेलंगाना सरकार की प्रमुख कैशलेस स्वास्थ्य योजना, जिसकी सीमा बढ़ाकर प्रति परिवार प्रति वर्ष ₹10 लाख कर दी गई है, जिसमें 1,672 उपचार, अंग प्रत्यारोपण और कैंसर थेरेपी शामिल हैं।",
    benefitsEn: [
      "Enhanced cashless health cover of up to ₹10,00,000 per family per year",
      "Covers 1,672 medical and surgical procedures across empanelled network hospitals",
      "Comprehensive end-to-end coverage: IPD hospitalization, ICU, medicines, diagnostics",
      "Free follow-up consultations and medicines for 1 year for chronic post-surgical cases",
      "Aarogyamitra stationed at all network hospitals to assist rural patients"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹10,00,000 तक का विस्तारित कैशलेस स्वास्थ्य बीमा कवर",
      "सूचीबद्ध नेटवर्क अस्पतालों में 1,672 मेडिकल और सर्जिकल उपचार प्रक्रियाएं शामिल",
      "अस्पताल में भर्ती, आईसीयू, दवाएं, सर्जरी और भोजन सहित संपूर्ण एंड-टू-एंड कवर",
      "सर्जरी के बाद गंभीर मामलों में 1 वर्ष तक मुफ्त फॉलो-अप जांच और दवाएं",
      "मरीजों की सहायता के लिए सभी अस्पतालों में आरोग्यमित्र प्रतिनिधि तैनात"
    ],
    eligibilityEn: "BPL families holding Food Security Cards (FSC) issued by Civil Supplies Dept. of Telangana.",
    eligibilityHi: "तेलंगाना सरकार के नागरिक आपूर्ति विभाग द्वारा जारी खाद्य सुरक्षा कार्ड (FSC) धारक बीपीएल परिवार।",
    contactPhone: "104 / 1800-599-4455",
    contactWeb: "aarogyasri.telangana.gov.in",
    applicationModeEn: "Direct cashless admission at network hospital using Food Security Card and Aadhaar",
    applicationModeHi: "खाद्य सुरक्षा कार्ड और आधार कार्ड लेकर किसी भी नेटवर्क अस्पताल में सीधे भर्ती हों",
    themeColor: {
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-800 border-sky-200",
      border: "border-sky-300",
      cardBg: "bg-sky-50/15",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700"
    },
    badgeTagEn: "Telangana Enhanced",
    badgeTagHi: "तेलंगाना ₹10 लाख कवर"
  },
  {
    id: "wb-swasthya-sathi",
    titleEn: "Swasthya Sathi Scheme",
    titleHi: "स्वास्थ्य साथी योजना",
    scope: "state",
    stateCode: "19",
    stateNameEn: "West Bengal",
    stateNameHi: "पश्चिम बंगाल",
    departmentEn: "Health & Family Welfare Dept., Govt. of West Bengal",
    departmentHi: "स्वास्थ्य एवं परिवार कल्याण विभाग, पश्चिम बंगाल सरकार",
    targetBeneficiariesEn: "Entire resident population of West Bengal (Universal)",
    targetBeneficiariesHi: "पश्चिम बंगाल की संपूर्ण निवासी आबादी (सार्वभौमिक)",
    categories: ["poverty_upliftment", "females"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Universal paperless and cashless smart-card health assurance scheme launched by West Bengal, uniquely issued in the name of the eldest female member of the family with zero cap on family size.",
    descriptionHi: "पश्चिम बंगाल की सार्वभौमिक पेपरलेस व कैशलेस स्वास्थ्य योजना, जिसका स्मार्ट कार्ड परिवार की सबसे वरिष्ठ महिला के नाम पर जारी होता है और परिवार के आकार पर कोई सीमा नहीं होती।",
    benefitsEn: [
      "Basic health cover of ₹5,00,000 per family per year for secondary and tertiary care",
      "Smart card issued in the name of the eldest female member, empowering women in healthcare decisions",
      "No restriction on family size; covers all dependent parents, in-laws, and children",
      "All pre-existing diseases covered from day 1 across 1,500+ private and government hospitals",
      "Includes daily transportation allowance upon discharge"
    ],
    benefitsHi: [
      "माध्यमिक और तृतीयक देखभाल के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 का बुनियादी स्वास्थ्य कवर",
      "परिवार की सबसे वरिष्ठ महिला के नाम पर जारी स्मार्ट कार्ड, जो महिलाओं को निर्णय लेने में सशक्त बनाता है",
      "परिवार के सदस्यों की संख्या पर कोई सीमा नहीं; माता-पिता और सास-ससुर भी शामिल",
      "1,500+ निजी और सरकारी अस्पतालों में पहले दिन से सभी पुरानी बीमारियां पूरी तरह कवर",
      "अस्पताल से छुट्टी मिलने पर दैनिक यात्रा भत्ता भी प्रदान किया जाता है"
    ],
    eligibilityEn: "All permanent residents of West Bengal not covered under any other statutory govt health scheme.",
    eligibilityHi: "पश्चिम बंगाल के सभी स्थायी निवासी जो किसी अन्य सरकारी स्वास्थ्य योजना के तहत कवर नहीं हैं।",
    contactPhone: "1800-345-5384",
    contactWeb: "swasthyasathi.gov.in",
    applicationModeEn: "Apply during Duare Sarkar outreach camps or online at swasthyasathi.gov.in",
    applicationModeHi: "'दुआरे सरकार' शिविरों में या swasthyasathi.gov.in पर ऑनलाइन आवेदन करें",
    themeColor: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800 border-emerald-200",
      border: "border-emerald-300",
      cardBg: "bg-emerald-50/15",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700"
    },
    badgeTagEn: "Women-Headed Smart Card",
    badgeTagHi: "महिला प्रमुख स्मार्ट कार्ड"
  },
  {
    id: "rj-chiranjeevi-maay",
    titleEn: "Mukhyamantri Ayushman Arogya Yojana (MAAY / Chiranjeevi)",
    titleHi: "मुख्यमंत्री आयुष्मान आरोग्य योजना (MAAY / चिरंजीवी)",
    scope: "state",
    stateCode: "08",
    stateNameEn: "Rajasthan",
    stateNameHi: "राजस्थान",
    departmentEn: "State Health Assurance Agency, Govt. of Rajasthan",
    departmentHi: "राज्य स्वास्थ्य गारंटी एजेंसी, राजस्थान सरकार",
    targetBeneficiariesEn: "All families of Rajasthan (Free for NFSA/BPL, subsidized for others)",
    targetBeneficiariesHi: "राजस्थान के सभी परिवार (एनएफएसए/बीपीएल हेतु मुफ्त, अन्यों हेतु रियायती)",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "Up to ₹25,00,000 / family / year",
    descriptionEn: "Rajasthan's massive health insurance initiative providing up to ₹25 Lakh cashless inpatient hospitalization cover across 1,798 packages in private and public empanelled hospitals.",
    descriptionHi: "राजस्थान की विशाल स्वास्थ्य बीमा योजना जो निजी और सरकारी सूचीबद्ध अस्पतालों में 1,798 उपचार पैकेजों के लिए प्रति परिवार प्रति वर्ष ₹25 लाख तक का कैशलेस इनडोर इलाज देती है।",
    benefitsEn: [
      "Inpatient treatment coverage up to ₹25,00,000 per family per year",
      "Covers 1,798 medical and surgical packages including organ transplants, oncology, and neurosurgery",
      "Free accidental insurance cover of ₹10,00,000 integrated alongside",
      "Includes 5 days pre-hospitalization and 15 days post-hospitalization medication and diagnostics",
      "Linked seamlessly with Jan Aadhaar card for instant cashless registration"
    ],
    benefitsHi: [
      "अस्पताल में भर्ती होने पर प्रति परिवार प्रति वर्ष ₹25,00,000 तक का रिकॉर्ड इलाज कवर",
      "अंग प्रत्यारोपण, कैंसर और न्यूरोसर्जरी सहित 1,798 मेडिकल और सर्जिकल पैकेज शामिल",
      "योजना के साथ ₹10,00,000 का दुर्घटना बीमा कवर भी शामिल",
      "भर्ती होने से 5 दिन पहले और छुट्टी के बाद 15 दिनों तक की दवाएं व जांचें पूरी तरह कवर",
      "त्वरित कैशलेस पंजीकरण के लिए सीधे 'जन आधार' कार्ड से जुड़ा हुआ"
    ],
    eligibilityEn: "Free for NFSA, SECC, small/marginal farmers, and contract workers; available to other families at nominal ₹850/year premium.",
    eligibilityHi: "NFSA, बीपीएल, लघु/सीमांत किसानों और संविदाकर्मियों के लिए मुफ्त; अन्य परिवारों के लिए मात्र ₹850/वर्ष में उपलब्ध।",
    contactPhone: "181 (Rajasthan Helpline)",
    contactWeb: "health.rajasthan.gov.in",
    applicationModeEn: "Register online using Jan Aadhaar card via SSO portal (sso.rajasthan.gov.in) or E-Mitra kiosk",
    applicationModeHi: "ई-मित्र कियोस्क या एसएसओ पोर्टल (sso.rajasthan.gov.in) पर जन आधार कार्ड के माध्यम से पंजीकरण",
    themeColor: {
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-800 border-amber-200",
      border: "border-amber-300",
      cardBg: "bg-amber-50/15",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700"
    },
    badgeTagEn: "Rajasthan Universal ₹25L",
    badgeTagHi: "राजस्थान ₹25 लाख कवर"
  },
  {
    id: "gj-mukhyamantri-amrutam",
    titleEn: "Mukhyamantri Amrutam (MA) & MA Vatsalya Yojana",
    titleHi: "मुख्यमंत्री अमृतम (MA) एवं मा वात्सल्य योजना",
    scope: "state",
    stateCode: "24",
    stateNameEn: "Gujarat",
    stateNameHi: "गुजरात",
    departmentEn: "Commissioner of Health, Medical Services & Medical Education, Gujarat",
    departmentHi: "स्वास्थ्य, चिकित्सा सेवाएं एवं चिकित्सा शिक्षा आयुक्त, गुजरात",
    targetBeneficiariesEn: "BPL and lower-middle-class families with annual income up to ₹4 Lakh in Gujarat",
    targetBeneficiariesHi: "गुजरात के बीपीएल और ₹4 लाख तक वार्षिक आय वाले मध्यमवर्गीय परिवार",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "Up to ₹10,00,000 / family / year",
    descriptionEn: "Gujarat state initiative providing cashless secondary and tertiary healthcare coverage of up to ₹10 Lakh per family per year for catastrophic illnesses across cardiovascular, neuro, burns, and cancer.",
    descriptionHi: "गुजरात सरकार की योजना जो हृदय रोग, न्यूरोसर्जरी, बर्न और कैंसर जैसी गंभीर बीमारियों के लिए प्रति परिवार प्रति वर्ष ₹10 लाख तक का कैशलेस इलाज देती है।",
    benefitsEn: [
      "Cashless tertiary healthcare cover of up to ₹10,00,000 per family per year",
      "Covers 2,700+ medical and surgical procedures across premier public and private hospitals",
      "Travel allowance of ₹300 per hospital visit paid directly to patient upon discharge",
      "Includes all pre-existing illnesses without any exclusion or waiting period",
      "Dedicated MA kiosks with biometric authentication for quick admission"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹10,00,000 तक का व्यापक कैशलेस तृतीयक स्वास्थ्य कवर",
      "प्रमुख निजी और सरकारी अस्पतालों में 2,700+ मेडिकल और सर्जिकल प्रक्रियाएं शामिल",
      "अस्पताल से छुट्टी के समय मरीज को प्रति यात्रा ₹300 का यात्रा भत्ता नकद दिया जाता है",
      "बिना किसी प्रतीक्षा अवधि के पहले से मौजूद सभी पुरानी बीमारियां शामिल",
      "अस्पतालों में बायोमेट्रिक सत्यापन और त्वरित प्रवेश के लिए समर्पित 'मा' कियोस्क"
    ],
    eligibilityEn: "BPL families and lower-middle-income families in Gujarat with verified annual income up to ₹4,00,000.",
    eligibilityHi: "गुजरात के बीपीएल परिवार और ₹4,00,000 तक की प्रमाणित वार्षिक आय वाले निम्न-मध्यम वर्गीय परिवार।",
    contactPhone: "1800-233-1022",
    contactWeb: "magujarat.com",
    applicationModeEn: "Apply at Taluka Civic Centre, District Collectorate, or nearest Empanelled Hospital MA Kiosk",
    applicationModeHi: "तालुका नागरिक केंद्र, जिला कलेक्ट्रेट, या सूचीबद्ध अस्पताल के 'मा' कियोस्क पर आवेदन करें",
    themeColor: {
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800 border-blue-200",
      border: "border-blue-300",
      cardBg: "bg-blue-50/15",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700"
    },
    badgeTagEn: "Gujarat ₹10 Lakh Cover",
    badgeTagHi: "गुजरात ₹10 लाख कवर"
  },
  {
    id: "od-bsky",
    titleEn: "Biju Swasthya Kalyan Yojana (BSKY)",
    titleHi: "बीजू स्वास्थ्य कल्याण योजना (BSKY)",
    scope: "state",
    stateCode: "21",
    stateNameEn: "Odisha",
    stateNameHi: "ओडिशा",
    departmentEn: "Health & Family Welfare Dept., Govt. of Odisha",
    departmentHi: "स्वास्थ्य एवं परिवार कल्याण विभाग, ओडिशा सरकार",
    targetBeneficiariesEn: "Nearly 1 Crore families covered under NFSA and BSKY smart health cards in Odisha",
    targetBeneficiariesHi: "ओडिशा के एनएफएसए और बीएसकेवाई स्मार्ट हेल्थ कार्ड धारक लगभग 1 करोड़ परिवार",
    categories: ["poverty_upliftment", "females", "cancer"],
    coverageAmount: "₹5,00,000 for males / ₹10,00,000 for female members",
    descriptionEn: "Odisha's flagship healthcare program granting universal free treatment in all state government healthcare facilities and up to ₹10 Lakh cashless coverage for women in 650+ premier private hospitals nationwide.",
    descriptionHi: "ओडिशा की प्रमुख स्वास्थ्य योजना जो सभी राज्य सरकारी अस्पतालों में मुफ्त इलाज और 650+ बड़े निजी अस्पतालों में महिलाओं के लिए ₹10 लाख तथा पुरुषों के लिए ₹5 लाख का कैशलेस कवर देती है।",
    benefitsEn: [
      "100% free treatment for all citizens in all state government hospitals from Sub-Centres to Medical Colleges",
      "Cashless private hospital coverage of ₹5,00,000 per family and ₹10,00,000 for female members",
      "Network of 650+ premier private hospitals inside and outside Odisha (Kolkata, Mumbai, Delhi, Visakhapatnam)",
      "Covers 2,000+ packages including major cancer surgeries, chemotherapy, cardiac bypass, and neurosurgery",
      "BSKY Smart Health Card enables 1-tap cashless admission"
    ],
    benefitsHi: [
      "राज्य के सभी सरकारी अस्पतालों (उपकेंद्र से मेडिकल कॉलेज तक) में सभी के लिए 100% मुफ्त इलाज",
      "सूचीबद्ध निजी अस्पतालों में परिवार हेतु ₹5,00,000 और महिला सदस्यों के लिए ₹10,00,000 का कैशलेस कवर",
      "ओडिशा के साथ-साथ कोलकाता, मुंबई, दिल्ली और विशाखापत्तनम के 650+ शीर्ष निजी अस्पतालों में मान्य",
      "कैंसर सर्जरी, कीमोथेरेपी, हार्ट बाईपास और न्यूरोसर्जरी सहित 2,000+ उपचार पैकेज शामिल",
      "बीएसकेवाई स्मार्ट हेल्थ कार्ड के जरिए अस्पताल में तुरंत कैशलेस भर्ती की सुविधा"
    ],
    eligibilityEn: "All NFSA and SFSS ration card holders in Odisha possessing BSKY Smart Health Cards.",
    eligibilityHi: "ओडिशा के सभी राष्ट्रीय और राज्य खाद्य सुरक्षा योजना राशन कार्ड धारक परिवार जिनके पास बीएसकेवाई कार्ड है।",
    contactPhone: "104 / 155369",
    contactWeb: "bsky.odisha.gov.in",
    applicationModeEn: "Automatic cashless admission upon showing BSKY Smart Card at Swasthya Mitra Helpdesk in hospital",
    applicationModeHi: "अस्पताल में स्थित 'स्वास्थ्य मित्र' सहायता केंद्र पर बीएसकेवाई स्मार्ट कार्ड दिखाकर तुरंत भर्ती",
    themeColor: {
      badgeBg: "bg-green-50",
      badgeText: "text-green-800 border-green-200",
      border: "border-green-300",
      cardBg: "bg-green-50/15",
      iconBg: "bg-green-100",
      iconColor: "text-green-700"
    },
    badgeTagEn: "Odisha Flagship",
    badgeTagHi: "ओडिशा महिला ₹10L"
  },
  {
    id: "kl-karunya-kasp",
    titleEn: "Karunya Arogya Suraksha Padhathi (KASP) & Karunya Benevolent Fund",
    titleHi: "कारुण्य आरोग्य सुरक्षा पद्धति (KASP) एवं कारुण्य कल्याण कोष",
    scope: "state",
    stateCode: "32",
    stateNameEn: "Kerala",
    stateNameHi: "केरल",
    departmentEn: "State Health Agency (SHA), Govt. of Kerala",
    departmentHi: "राज्य स्वास्थ्य एजेंसी (SHA), केरल सरकार",
    targetBeneficiariesEn: "Low-income and vulnerable families in Kerala + chronic disease patients",
    targetBeneficiariesHi: "केरल के निम्न आय और कमजोर परिवार + गंभीर पुरानी बीमारियों के रोगी",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "₹5,00,000 / family / year (+ ₹2 Lakh for Chronic Illness)",
    descriptionEn: "Kerala's health assurance framework delivering ₹5 Lakh cashless hospitalization cover, supplemented by the Karunya Benevolent Fund providing up to ₹2 Lakh financial aid for cancer, dialysis, and hemophilia.",
    descriptionHi: "केरल की स्वास्थ्य गारंटी योजना जो ₹5 लाख का कैशलेस अस्पताल कवर देती है, साथ ही कारुण्य फंड द्वारा कैंसर, डायलिसिस और हीमोफिलिया के लिए ₹2 लाख की अतिरिक्त वित्तीय सहायता प्रदान करती है।",
    benefitsEn: [
      "Cashless health insurance coverage of ₹5,00,000 per family per year for secondary and tertiary care",
      "Additional financial grant up to ₹2,00,000 under Karunya Benevolent Fund for catastrophic illnesses",
      "Network of 550+ government and empanelled private hospitals across Kerala",
      "Free dialysis coupons and specialized pediatric oncology care",
      "Seamless management through State Health Agency Kerala digital portal"
    ],
    benefitsHi: [
      "माध्यमिक और तृतीयक अस्पताल देखभाल के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 का कैशलेस कवर",
      "गंभीर बीमारियों के लिए कारुण्य कल्याण कोष के तहत ₹2,00,000 तक का अतिरिक्त वित्तीय अनुदान",
      "केरल के 550+ सरकारी और सूचीबद्ध निजी अस्पतालों का व्यापक नेटवर्क",
      "किडनी मरीजों के लिए मुफ्त डायलिसिस कूपन और बाल कैंसर देखभाल शामिल",
      "राज्य स्वास्थ्य एजेंसी (SHA) केरल के डिजिटल पोर्टल द्वारा सरल दावा प्रबंधन"
    ],
    eligibilityEn: "Economically weak families registered under Kerala BPL registry and Karunya health card holders.",
    eligibilityHi: "केरल बीपीएल सूची में पंजीकृत आर्थिक रूप से कमजोर परिवार और कारुण्य कार्ड धारक।",
    contactPhone: "104 / 1800-425-1073",
    contactWeb: "sha.kerala.gov.in",
    applicationModeEn: "Apply through KASP Kiosk at network hospitals or online at sha.kerala.gov.in",
    applicationModeHi: "नेटवर्क अस्पतालों में स्थित केएएसपी कियोस्क पर या sha.kerala.gov.in पर ऑनलाइन आवेदन करें",
    themeColor: {
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800 border-teal-200",
      border: "border-teal-300",
      cardBg: "bg-teal-50/15",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700"
    },
    badgeTagEn: "Kerala Karunya",
    badgeTagHi: "केरल कारुण्य"
  },
  {
    id: "up-mmjay",
    titleEn: "Mukhyamantri Jan Arogya Yojana (MMJAY)",
    titleHi: "मुख्यमंत्री जन आरोग्य योजना (MMJAY)",
    scope: "state",
    stateCode: "09",
    stateNameEn: "Uttar Pradesh",
    stateNameHi: "उत्तर प्रदेश",
    departmentEn: "State Agency for Comprehensive Health & Integrated Services (SACHIS), Govt. of UP",
    departmentHi: "साचिस (SACHIS), उत्तर प्रदेश सरकार",
    targetBeneficiariesEn: "Unorganized workers, Antyodaya families, and poor households excluded from PM-JAY in UP",
    targetBeneficiariesHi: "उत्तर प्रदेश के असंगठित कर्मकार, अंत्योदय परिवार और पीएम-जय से छूटे गरीब परिवार",
    categories: ["poverty_upliftment"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Uttar Pradesh government scheme extending ₹5 Lakh annual cashless healthcare cover to millions of poor families, unorganized labourers, and Antyodaya beneficiaries who were left out of the SECC 2011 PM-JAY database.",
    descriptionHi: "उत्तर प्रदेश सरकार की योजना जो एसईसीसी सूची से छूटे लाखों गरीब परिवारों, असंगठित मजदूरों और अंत्योदय लाभार्थियों को ₹5 लाख का वार्षिक कैशलेस स्वास्थ्य कवर देती है।",
    benefitsEn: [
      "Cashless health insurance cover of ₹5,00,000 per family per year",
      "Treatments available across 3,000+ empanelled government and private hospitals in UP",
      "Covers 1,949 medical and surgical procedures identically mapped with PM-JAY guidelines",
      "Includes registered BOCW construction workers and agricultural labourers",
      "Pre and post-hospitalization medical expenses covered"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 का निःशुल्क कैशलेस अस्पताल भर्ती कवर",
      "उत्तर प्रदेश के 3,000+ सूचीबद्ध सरकारी और निजी अस्पतालों में इलाज की सुविधा",
      "पीएम-जय के समान 1,949 मेडिकल और सर्जिकल उपचार प्रक्रियाएं पूरी तरह कवर",
      "भवन एवं संनिर्माण कर्मकार (BOCW) बोर्ड के पंजीकृत मजदूर भी पूरी तरह शामिल",
      "अस्पताल में भर्ती होने से पहले और छुट्टी के बाद का दवा खर्च शामिल"
    ],
    eligibilityEn: "Antyodaya Anna Yojana (AAY) cardholders, registered building & construction workers, and identified rural/urban poor in UP not in PM-JAY.",
    eligibilityHi: "उत्तर प्रदेश के अंत्योदय राशन कार्ड धारक, पंजीकृत संनिर्माण कर्मकार और पीएम-जय से वंचित गरीब परिवार।",
    contactPhone: "1800-180-04444",
    contactWeb: "sachs.up.gov.in",
    applicationModeEn: "Generate Golden Card at any Common Service Centre (CSC) or Government Hospital in UP",
    applicationModeHi: "उत्तर प्रदेश के किसी भी सीएससी केंद्र या सरकारी अस्पताल में जाकर आयुष्मान/जन आरोग्य गोल्डन कार्ड बनवाएं",
    themeColor: {
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-800 border-indigo-200",
      border: "border-indigo-300",
      cardBg: "bg-indigo-50/15",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700"
    },
    badgeTagEn: "UP State Cover",
    badgeTagHi: "उत्तर प्रदेश जन आरोग्य"
  },
  {
    id: "as-ayushman-asom",
    titleEn: "Ayushman Asom (Mukhya Mantri Jan Arogya Yojana) & Atal Amrit",
    titleHi: "आयुष्मान असम (मुख्यमंत्री जन आरोग्य योजना) एवं अटल अमृत",
    scope: "state",
    stateCode: "18",
    stateNameEn: "Assam",
    stateNameHi: "असम",
    departmentEn: "State Health Authority, Govt. of Assam",
    departmentHi: "राज्य स्वास्थ्य प्राधिकरण, असम सरकार",
    targetBeneficiariesEn: "All NFSA ration card holders across Assam",
    targetBeneficiariesHi: "असम के सभी राष्ट्रीय खाद्य सुरक्षा (NFSA) राशन कार्ड धारक",
    categories: ["poverty_upliftment", "cancer", "kidney"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Assam government initiative providing universalized ₹5 Lakh cashless healthcare coverage to all NFSA ration card holders, covering 1,578 medical and surgical procedures across Assam and premier hospitals pan-India.",
    descriptionHi: "असम सरकार की योजना जो राज्य के सभी राशन कार्ड धारक परिवारों को असम और देशभर के सूचीबद्ध अस्पतालों में 1,578 प्रक्रियाओं के लिए ₹5 लाख का कैशलेस स्वास्थ्य कवर देती है।",
    benefitsEn: [
      "Cashless health insurance cover of up to ₹5,00,000 per family per year",
      "Covers 1,578 medical and surgical treatments including cardiac surgery, cancer, and kidney care",
      "Network covers all medical colleges in Assam and premier hospitals in Kolkata, Delhi, and Bengaluru",
      "No waiting period for pre-existing critical conditions",
      "Integrated with NFSA ration cards for instantaneous family onboarding"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 तक का व्यापक कैशलेस स्वास्थ्य बीमा कवर",
      "हार्ट सर्जरी, कैंसर कीमोथेरेपी और किडनी डायलिसिस सहित 1,578 प्रक्रियाएं शामिल",
      "असम के सभी मेडिकल कॉलेज और कोलकाता, दिल्ली व बेंगलुरु के बड़े निजी अस्पताल नेटवर्क में शामिल",
      "पहले से मौजूद गंभीर बीमारियों के लिए कोई प्रतीक्षा अवधि नहीं",
      "राशन कार्ड से सीधे जुड़े होने के कारण तुरंत कैशलेस उपचार की सुविधा"
    ],
    eligibilityEn: "All families residing in Assam having a valid National Food Security Act (NFSA) ration card with Aadhaar seeding.",
    eligibilityHi: "असम के सभी निवासी परिवार जिनके पास आधार से जुड़ा वैध राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA) राशन कार्ड है।",
    contactPhone: "1800-102-7480",
    contactWeb: "sha.assam.gov.in",
    applicationModeEn: "Present NFSA Ration Card and Aadhaar at any empanelled hospital Ayushman Kendra in Assam",
    applicationModeHi: "असम के किसी भी सूचीबद्ध अस्पताल में स्थित आयुष्मान केंद्र पर राशन कार्ड और आधार दिखाकर प्रवेश",
    themeColor: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800 border-emerald-200",
      border: "border-emerald-300",
      cardBg: "bg-emerald-50/15",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700"
    },
    badgeTagEn: "Assam Universal",
    badgeTagHi: "असम आयुष्मान"
  },
  {
    id: "pb-mmsby",
    titleEn: "Ayushman Bharat Mukh Mantri Sehat Bima Yojana (AB-MMSBY)",
    titleHi: "आयुष्मान भारत मुख्यमंत्री सेहत बीमा योजना (AB-MMSBY)",
    scope: "state",
    stateCode: "03",
    stateNameEn: "Punjab",
    stateNameHi: "पंजाब",
    departmentEn: "State Health Agency, Govt. of Punjab",
    departmentHi: "राज्य स्वास्थ्य एजेंसी, पंजाब सरकार",
    targetBeneficiariesEn: "NFSA cardholders, farmers (J-Form), small traders, and construction workers in Punjab",
    targetBeneficiariesHi: "पंजाब के राशन कार्ड धारक, किसान (जे-फॉर्म), छोटे व्यापारी और निर्माण मजदूर",
    categories: ["poverty_upliftment", "cancer"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Punjab government's comprehensive health insurance scheme extending ₹5 Lakh annual cashless secondary and tertiary hospitalization to over 44 Lakh families across 800+ empanelled hospitals.",
    descriptionHi: "पंजाब सरकार की व्यापक स्वास्थ्य बीमा योजना जो राज्य के 44 लाख से अधिक परिवारों को 800+ सूचीबद्ध अस्पतालों में ₹5 लाख का वार्षिक कैशलेस अस्पताल भर्ती कवर देती है।",
    benefitsEn: [
      "Cashless hospitalization up to ₹5,00,000 per family per year",
      "Covers 1,600+ medical and surgical packages including knee/hip replacements, cardiac stents, cancer",
      "Empanelled network covers 800+ government and private hospitals across Punjab and Chandigarh",
      "Covers 3 days pre-hospitalization and 15 days post-hospitalization medication and testing",
      "Special health benefit cards issued to farmers and registered market traders"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 तक का कैशलेस अस्पताल भर्ती कवर",
      "घुटने/कूल्हे के प्रत्यारोपण, हार्ट स्टेंट और कैंसर सहित 1,600+ मेडिकल और सर्जिकल पैकेज शामिल",
      "पंजाब और चंडीगढ़ के 800+ सरकारी और निजी अस्पतालों में इलाज की सुविधा",
      "अस्पताल में भर्ती से 3 दिन पहले और छुट्टी के 15 दिन बाद तक की दवाएं व जांचें शामिल",
      "किसानों और छोटे व्यापारियों के लिए विशेष सेहत कार्ड जारी"
    ],
    eligibilityEn: "NFSA Blue Card holders, J-Form holding farmers, registered construction workers, and small traders in Punjab.",
    eligibilityHi: "पंजाब के नीले राशन कार्ड धारक, जे-फॉर्म वाले किसान, पंजीकृत निर्माण मजदूर और छोटे व्यापारी।",
    contactPhone: "104 / 14555",
    contactWeb: "sha.punjab.gov.in",
    applicationModeEn: "Generate E-Card at nearest Common Service Centre (CSC) or Empanelled Hospital kiosk",
    applicationModeHi: "नजदीकी सीएससी केंद्र या अस्पताल कियोस्क पर आधार और राशन कार्ड/जे-फॉर्म दिखाकर ई-कार्ड बनवाएं",
    themeColor: {
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800 border-blue-200",
      border: "border-blue-300",
      cardBg: "bg-blue-50/15",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700"
    },
    badgeTagEn: "Punjab Sehat Bima",
    badgeTagHi: "पंजाब सेहत बीमा"
  },
  {
    id: "hr-chirayu",
    titleEn: "Ayushman Chirayu Haryana Scheme",
    titleHi: "आयुष्मान चिरायु हरियाणा योजना",
    scope: "state",
    stateCode: "06",
    stateNameEn: "Haryana",
    stateNameHi: "हरियाणा",
    departmentEn: "Health Dept., Govt. of Haryana & Haryana Parivar Pehchan Patra Authority",
    departmentHi: "स्वास्थ्य विभाग, हरियाणा सरकार एवं परिवार पहचान पत्र प्राधिकरण",
    targetBeneficiariesEn: "Families in Haryana with annual income up to ₹3,00,000 under Parivar Pehchan Patra (PPP)",
    targetBeneficiariesHi: "परिवार पहचान पत्र (PPP) के तहत ₹3,00,000 तक की वार्षिक आय वाले हरियाणा के परिवार",
    categories: ["poverty_upliftment"],
    coverageAmount: "₹5,00,000 / family / year",
    descriptionEn: "Haryana government's expanded healthcare scheme extending the ₹5 Lakh cashless health cover to all families with annual income up to ₹3 Lakh verified via the Parivar Pehchan Patra (PPP) registry.",
    descriptionHi: "हरियाणा सरकार की विस्तारित स्वास्थ्य योजना जो परिवार पहचान पत्र (PPP) में ₹3 लाख तक की सत्यापित वार्षिक आय वाले सभी परिवारों को ₹5 लाख का कैशलेस स्वास्थ्य कवर देती है।",
    benefitsEn: [
      "Cashless health insurance cover of ₹5,00,000 per family per year",
      "Covers 1,500+ procedures across premier public and private hospitals in Haryana, Chandigarh, and NCR",
      "Direct integration with Parivar Pehchan Patra (PPP) for automated eligibility verification",
      "Free health screening and laboratory checkups under the Nirogi Haryana initiative",
      "No physical paperwork required; completely digital card generation"
    ],
    benefitsHi: [
      "प्रति परिवार प्रति वर्ष ₹5,00,000 का निःशुल्क कैशलेस स्वास्थ्य बीमा कवर",
      "हरियाणा, चंडीगढ़ और दिल्ली-एनसीआर के बड़े निजी व सरकारी अस्पतालों में 1,500+ उपचार प्रक्रियाएं शामिल",
      "पात्रता की स्वचालित जांच के लिए 'परिवार पहचान पत्र' (PPP) से सीधा डिजिटल जुड़ाव",
      "'निरोगी हरियाणा' पहल के तहत मुफ्त स्वास्थ्य जांच और बुनियादी पैथोलॉजी परीक्षण",
      "किसी कागजी झंझट के बिना तुरंत डिजिटल आयुष्मान-चिरायु कार्ड डाउनलोड"
    ],
    eligibilityEn: "Permanent resident families of Haryana with family income verified up to ₹3,00,000 in Parivar Pehchan Patra (PPP).",
    eligibilityHi: "हरियाणा के निवासी परिवार जिनकी परिवार पहचान पत्र (PPP) में सत्यापित वार्षिक आय ₹3,00,000 तक है।",
    contactPhone: "104 / 1800-180-2129",
    contactWeb: "chirayu.haryana.gov.in",
    applicationModeEn: "Download Chirayu Card online using PPP Family ID via chirayu.haryana.gov.in or nearest CSC",
    applicationModeHi: "पीपीपी फैमिली आईडी का उपयोग करके chirayu.haryana.gov.in या नजदीकी सीएससी से चिरायु कार्ड डाउनलोड करें",
    themeColor: {
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800 border-teal-200",
      border: "border-teal-300",
      cardBg: "bg-teal-50/15",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-700"
    },
    badgeTagEn: "Haryana Chirayu",
    badgeTagHi: "हरियाणा चिरायु"
  },
  {
    id: "br-chikitsa-sahayata",
    titleEn: "Mukhyamantri Chikitsa Sahayata Kosh (MMCSK)",
    titleHi: "मुख्यमंत्री चिकित्सा सहायता कोष (MMCSK)",
    scope: "state",
    stateCode: "10",
    stateNameEn: "Bihar",
    stateNameHi: "बिहार",
    departmentEn: "Health Department, Govt. of Bihar",
    departmentHi: "स्वास्थ्य विभाग, बिहार सरकार",
    targetBeneficiariesEn: "Low-income patients in Bihar suffering from 14 recognized critical illnesses",
    targetBeneficiariesHi: "14 मान्यता प्राप्त गंभीर बीमारियों से पीड़ित बिहार के निम्न आय वर्ग के मरीज",
    categories: ["poverty_upliftment", "cancer", "kidney", "disability"],
    coverageAmount: "Up to ₹2,50,000 direct grant",
    descriptionEn: "Bihar government emergency financial grant providing up to ₹2.5 Lakh direct assistance for treatment of 14 designated life-threatening diseases including cancer, heart surgery, paralysis, and kidney failure.",
    descriptionHi: "बिहार सरकार की आपातकालीन चिकित्सा सहायता योजना जो कैंसर, हृदय शल्य चिकित्सा, पक्षाघात (लकवा) और किडनी फेलियर जैसी 14 चिन्हित घातक बीमारियों के इलाज हेतु ₹2.5 लाख तक का वित्तीय अनुदान देती है।",
    benefitsEn: [
      "Direct financial grant up to ₹2,50,000 for specialized tertiary treatment",
      "Covers 14 major critical conditions: Cancer, Open Heart Surgery, Paralysis, Brain Hemorrhage, Renal Failure",
      "Financial assistance disbursed directly to treating government or empanelled private super-specialty hospital",
      "Covers treatment inside Bihar as well as premier hospitals outside (AIIMS New Delhi, CMC Vellore, Tata Memorial Mumbai)",
      "Single-window approval through District Magistrate / Civil Surgeon office"
    ],
    benefitsHi: [
      "विशेषज्ञ तृतीयक उपचार के लिए सीधे ₹2,50,000 तक का वित्तीय अनुदान",
      "14 प्रमुख गंभीर बीमारियां कवर: कैंसर, ओपन हार्ट सर्जरी, लकवा, ब्रेन हेमरेज, किडनी फेलियर",
      "उपचार करने वाले सरकारी या मान्यता प्राप्त निजी सुपर स्पेशियलिटी अस्पताल को सीधे भुगतान",
      "बिहार के साथ-साथ एम्स नई दिल्ली, सीएमसी वेल्लोर और टाटा मेमोरियल मुंबई जैसे शीर्ष अस्पतालों में भी मान्य",
      "जिलाधिकारी (DM) या सिविल सर्जन कार्यालय के माध्यम से सिंगल विंडो स्वीकृति"
    ],
    eligibilityEn: "Permanent residents of Bihar with family annual income up to ₹2,50,000 suffering from recognized designated ailments.",
    eligibilityHi: "बिहार के स्थायी निवासी परिवार जिनकी वार्षिक आय ₹2.5 लाख तक है और जो चिन्हित 14 गंभीर बीमारियों से पीड़ित हैं।",
    contactPhone: "0612-2215801 / 104",
    contactWeb: "state.bihar.gov.in/health",
    applicationModeEn: "Submit application with medical estimate and income certificate to District Civil Surgeon / DM Office",
    applicationModeHi: "अस्पताल के इलाज खर्च अनुमान और आय प्रमाण पत्र के साथ जिला सिविल सर्जन या डीएम कार्यालय में आवेदन करें",
    themeColor: {
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-800 border-rose-200",
      border: "border-rose-300",
      cardBg: "bg-rose-50/15",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-700"
    },
    badgeTagEn: "Bihar Critical Grant",
    badgeTagHi: "बिहार चिकित्सा अनुदान"
  },
  {
    id: "ga-ddssy",
    titleEn: "Deen Dayal Swasthya Seva Yojana (DDSSY)",
    titleHi: "दीन दयाल स्वास्थ्य सेवा योजना (DDSSY)",
    scope: "state",
    stateCode: "30",
    stateNameEn: "Goa",
    stateNameHi: "गोवा",
    departmentEn: "Directorate of Health Services, Govt. of Goa",
    departmentHi: "स्वास्थ्य सेवा निदेशालय, गोवा सरकार",
    targetBeneficiariesEn: "All permanent residents living in Goa for 5+ years",
    targetBeneficiariesHi: "गोवा में 5 या अधिक वर्षों से रह रहे सभी स्थायी निवासी परिवार",
    categories: ["poverty_upliftment"],
    coverageAmount: "Up to ₹4,00,000 / family / year",
    descriptionEn: "Goa state universal health insurance providing cashless hospitalization up to ₹4 Lakh for families residing in Goa for 5+ years, covering 447 medical and surgical procedures across empanelled hospitals.",
    descriptionHi: "गोवा सरकार की सार्वभौमिक स्वास्थ्य योजना जो गोवा में 5+ वर्षों से रह रहे परिवारों को 447 प्रक्रियाओं के लिए ₹4 लाख तक का कैशलेस अस्पताल भर्ती कवर देती है।",
    benefitsEn: [
      "Cashless health insurance cover up to ₹4,00,000 for a family of 4 or more (₹2.5 Lakh for family up to 3)",
      "Covers 447 medical/surgical procedures including cardiac stents, joint replacements, and ICU admissions",
      "Network covers all government hospitals and premier private nursing homes in Goa",
      "Pre-existing illnesses covered without exclusion; subsidized annual renewal premium of just ₹500 for general / ₹250 for OBC/SC/ST",
      "Instant smart card issued through GoaOnline portal"
    ],
    benefitsHi: [
      "4 या अधिक सदस्यों वाले परिवार के लिए ₹4,00,000 तक का कैशलेस कवर (3 सदस्यों तक ₹2.5 लाख)",
      "हार्ट स्टेंट, जोड़ प्रत्यारोपण और आईसीयू भर्ती सहित 447 मेडिकल/सर्जिकल प्रक्रियाएं शामिल",
      "गोवा के सभी सरकारी अस्पतालों और प्रमुख निजी अस्पतालों में मान्य",
      "पहले से मौजूद बीमारियां पहले दिन से कवर; नाममात्र वार्षिक नवीनीकरण शुल्क (सामान्य ₹500, आरक्षित ₹250)",
      "GoaOnline पोर्टल के माध्यम से तुरंत स्मार्ट कार्ड जारी"
    ],
    eligibilityEn: "Any family residing in the State of Goa for 5 years or more (evidenced by 5-year Residence Certificate).",
    eligibilityHi: "गोवा राज्य में 5 वर्ष या उससे अधिक समय से रह रहा कोई भी परिवार (5 वर्षीय निवास प्रमाण पत्र के साथ)।",
    contactPhone: "0832-2438844 / 0832-2437000",
    contactWeb: "goaonline.gov.in",
    applicationModeEn: "Apply online at goaonline.gov.in or visit nearest Goa Electronics Limited (GEL) facilitation centre",
    applicationModeHi: "goaonline.gov.in पर ऑनलाइन या नजदीकी जीईएल सुविधा केंद्र पर जाकर आवेदन करें",
    themeColor: {
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-800 border-sky-200",
      border: "border-sky-300",
      cardBg: "bg-sky-50/15",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-700"
    },
    badgeTagEn: "Goa Universal",
    badgeTagHi: "गोवा डीडीएसएसवाई"
  }
]
