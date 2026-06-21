import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Activity, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle,
  User, Heart, Brain, Eye, Ear, Thermometer, Droplet, Wind
} from 'lucide-react';

interface SymptomCheckerProps {
  setCurrentPage: (page: string) => void;
  language: string;
}

export function SymptomChecker({ setCurrentPage, language }: SymptomCheckerProps) {
  const [step, setStep] = useState(1);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | null>(null);

  const content = {
    en: {
      title: 'Symptom Checker',
      step1: 'Select Affected Body Part',
      step2: 'Select Your Symptoms',
      step3: 'Assessment Result',
      bodyParts: {
        head: 'Head', eyes: 'Eyes', ears: 'Ears', chest: 'Chest',
        stomach: 'Stomach', arms: 'Arms', legs: 'Legs', back: 'Back'
      },
      symptoms: {
        fever: 'Fever', pain: 'Pain', cough: 'Cough', breathing: 'Breathing Difficulty',
        dizziness: 'Dizziness', nausea: 'Nausea', weakness: 'Weakness', swelling: 'Swelling'
      },
      recommendations: {
        low: {
          title: 'Home Care Recommended',
          desc: 'Your symptoms appear mild. Rest and monitor your condition.',
          actions: ['Rest adequately', 'Stay hydrated', 'Monitor for 24-48 hours']
        },
        medium: {
          title: 'Consult a Doctor',
          desc: 'Your symptoms require medical attention.',
          actions: ['Book a teleconsultation', 'Visit nearby clinic', 'Keep monitoring symptoms']
        },
        high: {
          title: 'Visit Hospital Immediately',
          desc: 'Your symptoms require urgent medical attention.',
          actions: ['Visit nearest hospital now', 'Call emergency: 108', 'Inform family members']
        }
      },
      next: 'Next', back: 'Back', finish: 'Get Recommendation',
      bookConsult: 'Book Consultation', findHospital: 'Find Nearest Hospital',
      callEmergency: 'Call Emergency (108)', startOver: 'Check Again'
    },
    hi: {
      title: 'लक्षण जांचकर्ता',
      step1: 'प्रभावित शरीर का हिस्सा चुनें',
      step2: 'अपने लक्षण चुनें',
      step3: 'मूल्यांकन परिणाम',
      bodyParts: {
        head: 'सिर', eyes: 'आंखें', ears: 'कान', chest: 'छाती',
        stomach: 'पेट', arms: 'हाथ', legs: 'पैर', back: 'पीठ'
      },
      symptoms: {
        fever: 'बुखार', pain: 'दर्द', cough: 'खांसी', breathing: 'सांस लेने में कठिनाई',
        dizziness: 'चक्कर', nausea: 'मतली', weakness: 'कमजोरी', swelling: 'सूजन'
      },
      recommendations: {
        low: {
          title: 'घरेलू देखभाल अनुशंसित',
          desc: 'आपके लक्षण हल्के प्रतीत होते हैं। आराम करें और अपनी स्थिति की निगरानी करें।',
          actions: ['पर्याप्त आराम करें', 'हाइड्रेटेड रहें', '24-48 घंटे के लिए निगरानी करें']
        },
        medium: {
          title: 'डॉक्टर से परामर्श लें',
          desc: 'आपके लक्षणों के लिए चिकित्सा ध्यान की आवश्यकता है।',
          actions: ['टेलीपरामर्श बुक करें', 'निकटतम क्लिनिक पर जाएं', 'लक्षणों की निगरानी जारी रखें']
        },
        high: {
          title: 'तुरंत अस्पताल जाएं',
          desc: 'आपके लक्षणों के लिए तत्काल चिकित्सा ध्यान की आवश्यकता है।',
          actions: ['अभी निकटतम अस्पताल जाएं', 'आपातकाल कॉल करें: 108', 'परिवार के सदस्यों को सूचित करें']
        }
      },
      next: 'अगला', back: 'पीछे', finish: 'सिफारिश प्राप्त करें',
      bookConsult: 'परामर्श बुक करें', findHospital: 'निकटतम अस्पताल खोजें',
      callEmergency: 'आपातकाल कॉल करें (108)', startOver: 'फिर से जांचें'
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  const bodyParts = [
    { id: 'head', label: t.bodyParts.head, icon: Brain },
    { id: 'eyes', label: t.bodyParts.eyes, icon: Eye },
    { id: 'ears', label: t.bodyParts.ears, icon: Ear },
    { id: 'chest', label: t.bodyParts.chest, icon: Heart },
    { id: 'stomach', label: t.bodyParts.stomach, icon: Activity },
    { id: 'arms', label: t.bodyParts.arms, icon: User },
    { id: 'legs', label: t.bodyParts.legs, icon: User },
    { id: 'back', label: t.bodyParts.back, icon: User }
  ];

  const symptoms = [
    { id: 'fever', label: t.symptoms.fever, icon: Thermometer, severity: 'medium' },
    { id: 'pain', label: t.symptoms.pain, icon: AlertTriangle, severity: 'medium' },
    { id: 'cough', label: t.symptoms.cough, icon: Wind, severity: 'low' },
    { id: 'breathing', label: t.symptoms.breathing, icon: Wind, severity: 'high' },
    { id: 'dizziness', label: t.symptoms.dizziness, icon: Brain, severity: 'medium' },
    { id: 'nausea', label: t.symptoms.nausea, icon: Droplet, severity: 'low' },
    { id: 'weakness', label: t.symptoms.weakness, icon: Activity, severity: 'medium' },
    { id: 'swelling', label: t.symptoms.swelling, icon: AlertTriangle, severity: 'medium' }
  ];

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const calculateUrgency = () => {
    const severities = selectedSymptoms.map(id => 
      symptoms.find(s => s.id === id)?.severity || 'low'
    );
    
    if (severities.includes('high')) return 'high';
    if (severities.filter(s => s === 'medium').length >= 2) return 'medium';
    if (severities.length >= 3) return 'medium';
    return 'low';
  };

  const handleFinish = () => {
    const calculatedUrgency = calculateUrgency();
    setUrgency(calculatedUrgency);
    setStep(3);
  };

  const recommendation = urgency ? t.recommendations[urgency] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 rounded-full flex-1 max-w-[100px] ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Body Part Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.step1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bodyParts.map((part) => {
                  const Icon = part.icon;
                  const isSelected = selectedBodyPart === part.id;
                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedBodyPart(part.id)}
                      className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${
                        isSelected ? 'border-primary bg-blue-50' : 'border-border bg-white'
                      }`}
                    >
                      <Icon className={`h-12 w-12 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-sm font-medium text-center">{part.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedBodyPart}>
                  {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Symptom Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.step2}</CardTitle>
                <Badge variant="outline">
                  {selectedSymptoms.length} {language === 'en' ? 'selected' : 'चयनित'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {symptoms.map((symptom) => {
                  const Icon = symptom.icon;
                  const isSelected = selectedSymptoms.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg relative ${
                        isSelected ? 'border-primary bg-blue-50' : 'border-border bg-white'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                      <Icon className={`h-12 w-12 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-sm font-medium text-center">{symptom.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t.back}
                </Button>
                <Button onClick={handleFinish} disabled={selectedSymptoms.length === 0}>
                  {t.finish} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 3 && recommendation && (
          <div className="space-y-6">
            <Card className={`border-2 ${
              urgency === 'high' ? 'border-red-200 bg-red-50' :
              urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-green-200 bg-green-50'
            }`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {urgency === 'high' && <AlertTriangle className="h-12 w-12 text-red-600" />}
                  {urgency === 'medium' && <Activity className="h-12 w-12 text-yellow-600" />}
                  {urgency === 'low' && <CheckCircle className="h-12 w-12 text-green-600" />}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{recommendation.title}</h2>
                    <p className="text-gray-700">{recommendation.desc}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendation.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        urgency === 'high' ? 'text-red-600' :
                        urgency === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {urgency === 'high' && (
                <Button
                  onClick={() => window.open('tel:108')}
                  size="lg"
                  variant="destructive"
                  className="w-full"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  {t.callEmergency}
                </Button>
              )}
              {urgency === 'medium' && (
                <Button onClick={() => setCurrentPage('consultation')} size="lg" className="w-full">
                  {t.bookConsult}
                </Button>
              )}
              <Button onClick={() => setCurrentPage('locations')} variant="outline" size="lg" className="w-full">
                {t.findHospital}
              </Button>
              <Button onClick={() => { setStep(1); setSelectedBodyPart(null); setSelectedSymptoms([]); setUrgency(null); }} variant="outline">
                {t.startOver}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
