import { useRouter } from "next/navigation"
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Heart, Users, Calendar, Phone, Shield, Globe, Activity, MapPin, AlertTriangle, Stethoscope, Settings } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface LandingPageProps {
  language: string;
}

export function LandingPage({ language }: LandingPageProps) {
  const router = useRouter();
  const content = {
    en: {
      hero: {
        title: "Connecting Rural Communities to Quality Healthcare",
        subtitle: "Bridging the gap between villages and medical care through digital innovation",
        primaryCTA: "Get Started",
        secondaryCTA: "Book Consultation"
      },
      quickAccess: {
        title: "Quick Access",
        register: "Register / Login",
        consult: "Book Consultation",
        campaigns: "View Health Campaigns"
      },
      features: {
        title: "Our Services",
        directory: {
          title: "Hospital & Doctor Directory",
          description: "Find verified healthcare providers in your area"
        },
        consultation: {
          title: "Online Consultation",
          description: "Connect with doctors through chat, call, or video"
        },
        campaigns: {
          title: "Health Campaigns",
          description: "Join vaccination drives, health checkups, and awareness programs"
        },
        support: {
          title: "24/7 Support",
          description: "Emergency contact and continuous healthcare assistance"
        },
        multilingual: {
          title: "Multilingual Support",
          description: "Available in English, Hindi, and local dialects"
        },
        accessibility: {
          title: "Accessible Design",
          description: "Built for all users including persons with disabilities"
        }
      }
    },
    hi: {
      hero: {
        title: "गुणवत्तापूर्ण स्वास्थ्य सेवा से जोड़ते ग्रामीण समुदाय",
        subtitle: "डिजिटल नवाचार के माध्यम से गांवों और चिकित्सा देखभाल के बीच की दूरी को पाटना",
        primaryCTA: "शुरू करें",
        secondaryCTA: "परामर्श बुक करें"
      },
      quickAccess: {
        title: "त्वरित पहुंच",
        register: "पंजीकरण / लॉगिन",
        consult: "परामर्श बुक करें",
        campaigns: "स्वास्थ्य अभियान देखें"
      },
      features: {
        title: "हमारी सेवाएं",
        directory: {
          title: "अस्पताल और डॉक्टर निर्देशिका",
          description: "अपने क्षेत्र में सत्यापित स्वास्थ्य सेवा प्रदाता खोजें"
        },
        consultation: {
          title: "ऑनलाइन परामर्श",
          description: "चैट, कॉल या वीडियो के माध्यम से डॉक्टरों से जुड़ें"
        },
        campaigns: {
          title: "स्वास्थ्य अभियान",
          description: "टीकाकरण अभियान, स्वास्थ्य जांच और जागरूकता कार्यक्रमों में शामिल हों"
        },
        support: {
          title: "24/7 सहायता",
          description: "आपातकालीन संपर्क और निरंतर स्वास्थ्य सहायता"
        },
        multilingual: {
          title: "बहुभाषी सहायता",
          description: "अंग्रेजी, हिंदी और स्थानीय बोलियों में उपलब्ध"
        },
        accessibility: {
          title: "सुलभ डिज़ाइन",
          description: "विकलांग व्यक्तियों सहित सभी उपयोगकर्ताओं के लिए बनाया गया"
        }
      }
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-green-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  {t.hero.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {t.hero.subtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full relative z-10">
                <Button 
                  size="lg" 
                  onClick={() => router.push("/login")}
                  className="text-sm sm:text-base md:text-lg px-5 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto justify-center rounded-xl shadow-sm whitespace-normal break-words h-auto min-h-[44px]"
                >
                  <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>{t.hero.primaryCTA}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => router.push("/consultation")}
                  className="text-sm sm:text-base md:text-lg px-5 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto justify-center rounded-xl shadow-sm whitespace-normal break-words h-auto min-h-[44px]"
                >
                  <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>{t.hero.secondaryCTA}</span>
                </Button>
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={() => router.push("/emergency")}
                  className="text-sm sm:text-base md:text-lg px-5 sm:px-8 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 font-bold shadow-md text-white w-full sm:w-auto justify-center rounded-xl whitespace-normal break-words h-auto min-h-[44px] shrink-0"
                >
                  <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-pulse shrink-0" />
                  <span>{language === 'en' ? 'Emergency SOS' : 'आपातकालीन SOS'}</span>
                </Button>
              </div>
            </div>
            
            <div className="relative z-0 mt-6 lg:mt-0">
              <ImageWithFallback
                src="/hero.webp"
                alt="Rural healthcare - Doctor examining a child at a Primary Health Centre"
                className="rounded-lg shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Extended Quick Access Section */}
      <section className="py-16 px-4 bg-white border-t">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'More Services' : 'अधिक सेवाएं'}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/symptom-checker")}>
              <CardHeader className="text-center pb-4">
                <Activity className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-sm">
                  {language === 'en' ? 'Symptom Checker' : 'लक्षण जांच'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/consultation")}>
              <CardHeader className="text-center pb-4">
                <Phone className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-sm">
                  {language === 'en' ? 'Book Consultation' : 'परामर्श बुक करें'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/locations")}>
              <CardHeader className="text-center pb-4">
                <MapPin className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-sm">
                  {language === 'en' ? 'Nearest Hospital' : 'निकटतम अस्पताल'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-red-400 bg-red-50/60 shadow-sm hover:scale-[1.02]" onClick={() => router.push("/emergency")}>
              <CardHeader className="text-center pb-4">
                <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-2 animate-pulse" />
                <CardTitle className="text-sm font-bold text-red-700">
                  {language === 'en' ? 'Emergency Help (SOS)' : 'आपातकालीन सहायता (SOS)'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/directory")}>
              <CardHeader className="text-center pb-4">
                <Stethoscope className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-sm">
                  {language === 'en' ? 'Find Doctors' : 'डॉक्टर खोजें'}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/records")}>
              <CardHeader className="text-center pb-4">
                <Settings className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-sm">
                  {language === 'en' ? 'Health Records' : 'स्वास्थ्य रिकॉर्ड'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.directory.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.directory.description}</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.consultation.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.consultation.description}</CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/camps")}>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.campaigns.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.campaigns.description}</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.support.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.support.description}</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.multilingual.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.multilingual.description}</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.features.accessibility.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.features.accessibility.description}</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
