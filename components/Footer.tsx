import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Heart, Mail, Phone, MapPin, Facebook, Youtube, MessageCircle } from "lucide-react";

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

  const handleSocialClick = (platform: string) => {
    // In a real app, these would be actual social media links
    alert(language === 'en' 
      ? `Opening ${platform} page...` 
      : `${platform} पेज खोला जा रहा है...`);
  };

  const handleSubscribe = () => {
    alert(language === 'en' 
      ? 'Thank you for subscribing to our newsletter!' 
      : 'हमारे न्यूज़लेटर की सदस्यता के लिए धन्यवाद!');
  };

  const handleFeedback = () => {
    alert(language === 'en' 
      ? 'Feedback form would open here' 
      : 'यहाँ प्रतिक्रिया फॉर्म खुलेगा');
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
                onClick={() => setCurrentPage('campaigns')}
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
              <button className="block text-gray-300 hover:text-white transition-colors text-sm">
                {t.about}
              </button>
              <button className="block text-gray-300 hover:text-white transition-colors text-sm">
                {t.faq}
              </button>
              <button className="block text-gray-300 hover:text-white transition-colors text-sm">
                {t.privacy}
              </button>
              <button className="block text-gray-300 hover:text-white transition-colors text-sm">
                {t.contact}
              </button>
              <button 
                onClick={handleFeedback}
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                {t.feedback}
              </button>
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
            <div className="flex space-x-2">
              <Input 
                placeholder={t.emailPlaceholder}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button 
                onClick={handleSubscribe}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t.subscribe}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">{t.followUs}</h4>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800"
                  onClick={() => handleSocialClick('WhatsApp')}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800"
                  onClick={() => handleSocialClick('Facebook')}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800"
                  onClick={() => handleSocialClick('YouTube')}
                >
                  <Youtube className="h-4 w-4" />
                </Button>
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
