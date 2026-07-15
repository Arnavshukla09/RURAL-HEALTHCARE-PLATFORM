"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ShieldCheck, Heart, IndianRupee, Activity, CheckCircle, ArrowLeft } from "lucide-react"

interface GovernmentSchemesProps {
  language: string
}

export function GovernmentSchemes({ language }: GovernmentSchemesProps) {
  const router = useRouter()
  const en = language === "en"

  const schemes = [
    {
      title: en ? "Ayushman Bharat (PM-JAY)" : "आयुष्मान भारत (PM-JAY)",
      description: en 
        ? "World's largest health insurance scheme providing a health cover of ₹5 Lakhs per family per year for secondary and tertiary care hospitalization."
        : "दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना जो माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती होने के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य कवर प्रदान करती है।",
      benefits: en 
        ? ["Up to ₹5,000,000 cover per year", "Cashless access to health care", "Covers up to 3 days of pre-hospitalization and 15 days post-hospitalization"]
        : ["प्रति वर्ष ₹5,000,000 तक का कवर", "स्वास्थ्य देखभाल तक कैशलेस पहुंच", "अस्पताल में भर्ती होने से 3 दिन पहले और 15 दिन बाद तक का खर्च"],
      icon: <ShieldCheck className="h-6 w-6 text-green-600" />,
      color: "border-green-200 bg-green-50"
    },
    {
      title: en ? "Janani Suraksha Yojana (JSY)" : "जननी सुरक्षा योजना (JSY)",
      description: en 
        ? "A safe motherhood intervention scheme being implemented with the objective of reducing maternal and neonatal mortality by promoting institutional delivery among poor pregnant women."
        : "गरीब गर्भवती महिलाओं के बीच संस्थागत प्रसव को बढ़ावा देकर मातृ और नवजात मृत्यु दर को कम करने के उद्देश्य से एक सुरक्षित मातृत्व हस्तक्षेप योजना लागू की जा रही है।",
      benefits: en 
        ? ["Cash assistance of ₹1400 for rural mothers", "Cash assistance of ₹1000 for urban mothers", "ASHA worker incentive for facilitating institutional delivery"]
        : ["ग्रामीण माताओं के लिए ₹1400 की नकद सहायता", "शहरी माताओं के लिए ₹1000 की नकद सहायता", "संस्थागत प्रसव की सुविधा के लिए आशा कार्यकर्ता को प्रोत्साहन"],
      icon: <IndianRupee className="h-6 w-6 text-teal-600" />,
      color: "border-teal-200 bg-teal-50"
    },
    {
      title: en ? "Janani Shishu Suraksha Karyakaram (JSSK)" : "जननी शिशु सुरक्षा कार्यक्रम (JSSK)",
      description: en 
        ? "An initiative to eliminate out-of-pocket expenses for pregnant women delivering in public health institutions and sick infants accessing public health institutions for treatment."
        : "सार्वजनिक स्वास्थ्य संस्थानों में प्रसव कराने वाली गर्भवती महिलाओं और इलाज के लिए सार्वजनिक स्वास्थ्य संस्थानों में आने वाले बीमार शिशुओं के लिए खर्च को खत्म करने की एक पहल।",
      benefits: en 
        ? ["Absolutely free delivery, including C-section", "Free drugs, consumables, and blood provision", "Free diet during stay in the health institutions"]
        : ["सी-सेक्शन सहित बिल्कुल मुफ्त प्रसव", "मुफ्त दवाएं, उपभोग्य वस्तुएं और रक्त प्रावधान", "स्वास्थ्य संस्थानों में ठहरने के दौरान मुफ्त आहार"],
      icon: <Heart className="h-6 w-6 text-blue-600" />,
      color: "border-blue-200 bg-blue-50"
    },
    {
      title: en ? "Mukhyamantri Bal Hridaya Upchar Yojana" : "मुख्यमंत्री बाल हृदय उपचार योजना",
      description: en 
        ? "A Madhya Pradesh government scheme providing financial assistance for the treatment of children suffering from congenital heart diseases."
        : "मध्य प्रदेश सरकार की एक योजना जो जन्मजात हृदय रोगों से पीड़ित बच्चों के इलाज के लिए वित्तीय सहायता प्रदान करती है।",
      benefits: en 
        ? ["Free heart surgery for eligible children", "Pre and post-operative care covered", "Empanelled private and government hospitals"]
        : ["पात्र बच्चों के लिए मुफ्त हृदय शल्य चिकित्सा", "ऑपरेशन से पहले और बाद की देखभाल शामिल", "सूचीबद्ध निजी और सरकारी अस्पताल"],
      icon: <Activity className="h-6 w-6 text-red-600" />,
      color: "border-red-200 bg-red-50"
    },
    {
      title: en ? "Deendayal Antyodaya Upchar Yojana" : "दीनदयाल अंत्योदय उपचार योजना",
      description: en 
        ? "A state government scheme for Madhya Pradesh aimed at providing health security to the poorest of the poor."
        : "मध्य प्रदेश के लिए एक राज्य सरकार की योजना जिसका उद्देश्य गरीबों में सबसे गरीब लोगों को स्वास्थ्य सुरक्षा प्रदान करना है।",
      benefits: en 
        ? ["Free medical investigation and treatment up to ₹20,000", "Available for BPL (Below Poverty Line) cardholders", "Applicable in all government hospitals"]
        : ["₹20,000 तक मुफ्त चिकित्सा जांच और उपचार", "BPL (गरीबी रेखा से नीचे) कार्डधारकों के लिए उपलब्ध", "सभी सरकारी अस्पतालों में लागू"],
      icon: <ShieldCheck className="h-6 w-6 text-purple-600" />,
      color: "border-purple-200 bg-purple-50"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {en ? "Back" : "वापस"}
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{en ? "Government Health Schemes" : "सरकारी स्वास्थ्य योजनाएं"}</h1>
          <p className="text-gray-600">
            {en ? "Explore various health schemes provided by the Government of India and Madhya Pradesh." : "भारत सरकार और मध्य प्रदेश सरकार द्वारा प्रदान की जाने वाली विभिन्न स्वास्थ्य योजनाओं के बारे में जानें।"}
          </p>
        </div>

        <div className="grid gap-6">
          {schemes.map((scheme, index) => (
            <Card key={index} className={`overflow-hidden border-2 ${scheme.color}`}>
              <CardContent className="p-0">
                <div className="p-6 md:flex md:gap-6 bg-white/50">
                  <div className="shrink-0 mb-4 md:mb-0">
                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                      {scheme.icon}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h2 className="text-xl font-bold text-gray-900">{scheme.title}</h2>
                    <p className="text-gray-700 leading-relaxed text-sm">{scheme.description}</p>
                    <div className="pt-2">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">{en ? "Key Benefits:" : "मुख्य लाभ:"}</h4>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {scheme.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
