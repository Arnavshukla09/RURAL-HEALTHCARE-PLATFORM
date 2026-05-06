import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, Activity, Upload, Download, Calendar, 
  Thermometer, Heart, Droplets, Eye
} from 'lucide-react';

interface PatientRecordsProps {
  language: string;
}

export function PatientRecords({ language }: PatientRecordsProps) {
  const content = {
    en: {
      title: 'My Medical Records',
      subtitle: 'View and manage your health information',
      vitals: {
        title: 'Latest Vitals',
        bp: 'Blood Pressure',
        temp: 'Temperature',
        pulse: 'Pulse',
        sugar: 'Blood Sugar',
        recorded: 'Recorded on'
      },
      prescriptions: {
        title: 'Prescriptions',
        view: 'View',
        download: 'Download',
        noPrescriptions: 'No prescriptions available'
      },
      reports: {
        title: 'Lab Reports',
        upload: 'Upload New Report',
        noReports: 'No lab reports uploaded'
      },
      history: {
        title: 'Medical History',
        noHistory: 'No medical history recorded'
      }
    },
    hi: {
      title: 'मेरे चिकित्सा रिकॉर्ड',
      subtitle: 'अपनी स्वास्थ्य जानकारी देखें और प्रबंधित करें',
      vitals: {
        title: 'नवीनतम संकेत',
        bp: 'रक्तचाप',
        temp: 'तापमान',
        pulse: 'नाड़ी',
        sugar: 'रक्त शर्करा',
        recorded: 'दर्ज किया गया'
      },
      prescriptions: {
        title: 'प्रिस्क्रिप्शन',
        view: 'देखें',
        download: 'डाउनलोड',
        noPrescriptions: 'कोई प्रिस्क्रिप्शन उपलब्ध नहीं'
      },
      reports: {
        title: 'लैब रिपोर्ट',
        upload: 'नई रिपोर्ट अपलोड करें',
        noReports: 'कोई लैब रिपोर्ट अपलोड नहीं की गई'
      },
      history: {
        title: 'चिकित्सा इतिहास',
        noHistory: 'कोई चिकित्सा इतिहास दर्ज नहीं'
      }
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  // Sample vitals data
  const vitals = {
    bp: '120/80',
    temp: '98.6°F',
    pulse: '72',
    sugar: '95 mg/dL',
    date: '2025-11-25'
  };

  // Sample prescriptions
  const prescriptions = [
    {
      id: 1,
      doctor: 'Dr. Rajesh Kumar',
      date: '2025-11-20',
      medicines: ['Paracetamol 500mg', 'Vitamin D'],
      diagnosis: 'Common Cold'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Latest Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              {t.vitals.title}
            </CardTitle>
            <CardDescription>{t.vitals.recorded}: {vitals.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t.vitals.bp}</p>
                <p className="text-2xl font-bold text-gray-900">{vitals.bp}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Thermometer className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t.vitals.temp}</p>
                <p className="text-2xl font-bold text-gray-900">{vitals.temp}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t.vitals.pulse}</p>
                <p className="text-2xl font-bold text-gray-900">{vitals.pulse}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Droplets className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">{t.vitals.sugar}</p>
                <p className="text-2xl font-bold text-gray-900">{vitals.sugar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                {t.prescriptions.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptions.length > 0 ? (
                prescriptions.map((prescription) => (
                  <div key={prescription.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{prescription.doctor}</h4>
                        <p className="text-sm text-gray-500">{prescription.diagnosis}</p>
                      </div>
                      <Badge>{prescription.date}</Badge>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        {language === 'en' ? 'Medicines:' : 'दवाएं:'}
                      </p>
                      <ul className="text-sm space-y-1">
                        {prescription.medicines.map((med, idx) => (
                          <li key={idx}>• {med}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        {t.prescriptions.view}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        {t.prescriptions.download}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">{t.prescriptions.noPrescriptions}</p>
              )}
            </CardContent>
          </Card>

          {/* Lab Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-primary" />
                  {t.reports.title}
                </div>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  {t.reports.upload}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">{t.reports.noReports}</p>
            </CardContent>
          </Card>
        </div>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              {t.history.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">{t.history.noHistory}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
