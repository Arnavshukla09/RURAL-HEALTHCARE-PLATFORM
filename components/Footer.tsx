import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Heart, Mail, Phone, MapPin, Facebook, Youtube, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface FooterProps {
  setCurrentPage: (page: string) => void;
  language: string;
}

export function Footer({ setCurrentPage, language }: FooterProps) {
  const content = {
    en: {
      tagline: "Bridging Healthcare Gaps in Rural Communities",
      quickLinks: "Quick Links",
      about: "About Us",
      faq: "FAQ",
      privacy: "Privacy Policy",
      contact: "Contact Us",
      newsletter: "Stay Updated",
      emailPlaceholder: "Enter your email",
      subscribe: "Subscribe",
      followUs: "Follow Us",
      feedback: "Feedback",
      emergencyHotline: "Emergency Hotline",
      support: "24/7 Support Available",
      copyright: "© 2025 RuralHealth. All rights reserved.",
      address: "Village Health Initiative, District Health Department"
    },
    hi: {
      tagline: "ग्रामीण समुदायों में स्वास्थ्य सेवा की कमी को पाटना",
      quickLinks: "त्वरित लिंक",
      about: "हमारे बारे में",
      faq: "प्रश्न उत्तर",
      privacy: "गोपनीयता नीति",
      contact: "संपर्क करें",
      newsletter: "अपडेट रहें",
      emailPlaceholder: "अपना ईमेल दर्ज करें",
      subscribe: "सब्सक्राइब करें",
      followUs: "हमें फॉलो करें",
      feedback: "प्रतिक्रिया",
      emergencyHotline: "आपातकालीन हॉटलाइन",
      support: "24/7 सपोर्ट उपलब्ध",
      copyright: "© 2025 ग्रामीण स्वास्थ्य। सभी अधिकार सुरक्षित।",
      address: "ग्राम स्वास्थ्य पहल, जिला स्वास्थ्य विभाग"
    }
  };

  const t = content[language as keyof typeof content];

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const socialLinks: Record<string, string> = {
    GitHub: 'https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM',
    WhatsApp: 'https://wa.me/?text=Check%20out%20RuralHealth%20Platform',
    YouTube: 'https://youtube.com',
  };

  const handleSubscribe = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert(language === 'en' ? 'Please enter a valid email address' : 'कृपया एक वैध ईमेल दर्ज करें');
      return;
    }
    setSubscribed(true);
    setEmail("");
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sectionContent: Record<string, string> = {
    about: language === 'en'
      ? 'RuralHealth is a digital platform connecting rural communities in Madhya Pradesh to quality healthcare. We provide AI-powered symptom checking, teleconsultation, facility mapping, and health records — all free and accessible.'
      : 'ग्रामीण स्वास्थ्य एक डिजिटल प्लेटफ़ॉर्म है जो मध्य प्रदेश के ग्रामीण समुदायों को गुणवत्तापूर्ण स्वास्थ्य सेवा से जोड़ता है।',
    faq: language === 'en'
      ? '• Is this platform free? — Yes, completely free for all users.\n• How do I book a consultation? — Register, then use the Book Consultation feature.\n• Is my health data secure? — Yes, all data is encrypted and stored securely with Supabase.\n• Can I use this offline? — Basic features work offline; data syncs when you reconnect.'
      : '• क्या यह प्लेटफ़ॉर्म मुफ़्त है? — हाँ, सभी उपयोगकर्ताओं के लिए पूरी तरह से मुफ़्त।\n• मैं परामर्श कैसे बुक करूँ? — पंजीकरण करें, फिर परामर्श बुक करें।\n• क्या मेरा डेटा सुरक्षित है? — हाँ, सभी डेटा एन्क्रिप्टेड है।',
    privacy: language === 'en'
      ? 'Your privacy is important to us. We collect only essential health data needed to provide services. Your data is never sold or shared with third parties. All medical records are encrypted and accessible only to you and your healthcare providers.'
      : 'आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। हम केवल सेवाएं प्रदान करने के लिए आवश्यक डेटा एकत्र करते हैं।',
    contact: language === 'en'
      ? 'Email: support@ruralhealth.in\nPhone: 1800-123-4567 (Toll Free)\nAddress: Village Health Initiative, District Health Department, Bhopal, MP'
      : 'ईमेल: support@ruralhealth.in\nफोन: 1800-123-4567 (टोल फ्री)\nपता: ग्राम स्वास्थ्य पहल, जिला स्वास्थ्य विभाग, भोपाल, मप्र',
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Emergency Strip */}
      <div className="bg-red-600 py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-4">
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">{t.emergencyHotline}: 108</span>
            <span className="text-sm opacity-90">|</span>
            <span className="text-sm">{t.support}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold">
                {language === 'en' ? 'RuralHealth' : 'ग्रामीण स्वास्थ्य'}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t.tagline}
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{t.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@ruralhealth.gov.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>1800-123-4567</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.quickLinks}</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setCurrentPage('home')}
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {language === 'en' ? 'Home' : 'होम'}
              </button>
              <button 
                onClick={() => setCurrentPage('directory')}
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {language === 'en' ? 'Directory' : 'निर्देशिका'}
              </button>
              <button 
                onClick={() => setCurrentPage('camps')}
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {language === 'en' ? 'Campaigns' : 'अभियान'}
              </button>
              <button 
                onClick={() => setCurrentPage('consultation')}
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {language === 'en' ? 'Consultation' : 'परामर्श'}
              </button>
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{language === 'en' ? 'Support' : 'सहायता'}</h3>
            <div className="space-y-2">
              {(['about', 'faq', 'privacy', 'contact'] as const).map(key => (
                <div key={key}>
                  <button
                    onClick={() => toggleSection(key)}
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {t[key]}
                    {expandedSection === key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expandedSection === key && (
                    <p className="text-xs text-gray-400 mt-1 pl-2 border-l border-gray-700 whitespace-pre-line">
                      {sectionContent[key]}
                    </p>
                  )}
                </div>
              ))}
              <a
                href="mailto:support@ruralhealth.in?subject=Feedback"
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {t.feedback} <ExternalLink className="inline h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Newsletter & Social */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.newsletter}</h3>
            <p className="text-gray-300 text-sm">
              {language === 'en' 
                ? 'Get health tips and campaign updates' 
                : 'स्वास्थ्य सुझाव और अभियान अपडेट पाएं'}
            </p>
            {subscribed ? (
              <p className="text-green-400 text-sm">✅ {language === 'en' ? 'Subscribed! Thank you.' : 'सब्सक्राइब हो गया! धन्यवाद।'}</p>
            ) : (
              <div className="flex space-x-2">
                <Input 
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  type="email"
                />
                <Button 
                  onClick={handleSubscribe}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t.subscribe}
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">{t.followUs}</h4>
              <div className="flex space-x-3">
                <a href={socialLinks.WhatsApp} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-gray-600 hover:bg-gray-800">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </a>
                <a href={socialLinks.GitHub} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-gray-600 hover:bg-gray-800">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <a href={socialLinks.YouTube} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-gray-600 hover:bg-gray-800">
                    <Youtube className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">{t.copyright}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>
                {language === 'en' 
                  ? 'Made with ❤️ for rural communities' 
                  : 'ग्रामीण समुदायों के लिए ❤️ से बनाया गया'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
